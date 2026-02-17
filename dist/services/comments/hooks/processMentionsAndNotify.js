"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMentionsAndNotify = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const notificationDispatcher_1 = require("../../../providers/notifications/notificationDispatcher");
/**
 * Extracts ALL @[userId] mention tokens from comment content (including self-mentions).
 */
function extractAllMentionedUserIds(content) {
    const mentionRegex = /@\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/g;
    const ids = new Set();
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
        if (match[1])
            ids.add(match[1]);
    }
    return Array.from(ids);
}
/**
 * Replaces all @[userId] tokens in content with @FirstName LastName for human-readable display.
 */
async function humanizeContent(content) {
    const mentionRegex = /@\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/g;
    const matches = [...content.matchAll(mentionRegex)];
    if (matches.length === 0)
        return content;
    // Collect unique user IDs
    const userIds = [...new Set(matches.map((m) => m[1]))];
    // Batch-fetch names
    const nameMap = new Map();
    for (const uid of userIds) {
        nameMap.set(uid, await getUserDisplayName(uid));
    }
    // Replace tokens
    return content.replace(mentionRegex, (_full, uid) => {
        return `@${nameMap.get(uid) || 'Unknown'}`;
    });
}
/**
 * Gets a display name for a user.
 */
async function getUserDisplayName(userId) {
    const [user] = await adapters_1.db
        .select({ firstName: schema_1.users.firstName, lastName: schema_1.users.lastName, email: schema_1.users.email })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
        .limit(1);
    if (!user)
        return 'Someone';
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return name || user.email;
}
/**
 * After hook on create: processes @mentions in comment content,
 * creates comment_mentions records, and generates notifications + emails.
 *
 * Also handles:
 * - Reply notifications (comment_reply)
 * - Correction notifications
 * - Announcement notifications (to all project members)
 *
 * Social-media rules:
 * - No self-notifications
 * - Deduplication: each user is notified at most once per comment
 * - Email delivery respects user preferences via dispatchNotification
 */
const processMentionsAndNotify = async (context) => {
    const comment = context.result;
    if (!comment)
        return context;
    const authorId = comment.userId;
    const authorName = await getUserDisplayName(authorId);
    // Humanize content for notification body (replace @[uuid] → @Name)
    const humanBody = (await humanizeContent(comment.content)).substring(0, 200);
    // Track who has already been notified to avoid duplicates
    const notifiedUserIds = new Set([authorId]);
    // Build shared metadata and URL for email CTAs
    const baseMetadata = {
        projectId: comment.projectId,
        commentId: comment.id,
        targetType: comment.targetType,
        targetId: comment.targetId,
        stepId: comment.stepId,
    };
    const ctaUrl = (0, notificationDispatcher_1.buildCommentUrl)(baseMetadata);
    // ── 1. Process @mentions ──────────────────────────────────
    const mentionedUserIds = extractAllMentionedUserIds(comment.content);
    for (const mentionedUserId of mentionedUserIds) {
        // Always insert mention record (including self-mentions) for data integrity
        try {
            await adapters_1.db.insert(schema_1.commentMentions).values({
                commentId: comment.id,
                mentionedUserId,
            });
        }
        catch {
            // Ignore duplicate (unique constraint)
        }
        // Only send notification if it's NOT a self-mention
        if (mentionedUserId !== authorId) {
            await (0, notificationDispatcher_1.dispatchNotification)({
                userId: mentionedUserId,
                type: 'mention',
                projectId: comment.projectId,
                title: `${authorName} mentioned you`,
                body: humanBody,
                metadata: baseMetadata,
                email: {
                    subject: `${authorName} mentioned you in a comment on LumaWay`,
                    html: (0, notificationDispatcher_1.buildNotificationEmail)({
                        heading: 'You were mentioned',
                        body: `<strong>${authorName}</strong> mentioned you in a comment: <em>"${humanBody}"</em>`,
                        ctaLabel: 'View Comment',
                        ctaUrl,
                    }),
                    text: `${authorName} mentioned you in a comment: "${humanBody}"\n\nView it here: ${ctaUrl}`,
                },
            });
        }
        notifiedUserIds.add(mentionedUserId);
    }
    // ── 2. Reply notification ─────────────────────────────────
    if (comment.parentId) {
        const [parentComment] = await adapters_1.db
            .select({ userId: schema_1.comments.userId })
            .from(schema_1.comments)
            .where((0, drizzle_orm_1.eq)(schema_1.comments.id, comment.parentId))
            .limit(1);
        if (parentComment && !notifiedUserIds.has(parentComment.userId)) {
            await (0, notificationDispatcher_1.dispatchNotification)({
                userId: parentComment.userId,
                type: 'comment_reply',
                projectId: comment.projectId,
                title: `${authorName} replied to your comment`,
                body: humanBody,
                metadata: {
                    ...baseMetadata,
                    parentCommentId: comment.parentId,
                },
                email: {
                    subject: `${authorName} replied to your comment on LumaWay`,
                    html: (0, notificationDispatcher_1.buildNotificationEmail)({
                        heading: 'New reply to your comment',
                        body: `<strong>${authorName}</strong> replied to your comment: <em>"${humanBody}"</em>`,
                        ctaLabel: 'View Reply',
                        ctaUrl,
                    }),
                    text: `${authorName} replied to your comment: "${humanBody}"\n\nView it here: ${ctaUrl}`,
                },
            });
            notifiedUserIds.add(parentComment.userId);
        }
    }
    // ── 3. Correction notification ────────────────────────────
    if (comment.type === 'correction' && comment.targetType !== 'project') {
        // Notify project editors and owners about the correction
        const editorsAndOwners = await adapters_1.db
            .select({ userId: schema_1.projectMembers.userId, role: schema_1.projectMembers.role })
            .from(schema_1.projectMembers)
            .where((0, drizzle_orm_1.eq)(schema_1.projectMembers.projectId, comment.projectId));
        for (const member of editorsAndOwners) {
            if ((member.role === 'owner' || member.role === 'editor') && !notifiedUserIds.has(member.userId)) {
                await (0, notificationDispatcher_1.dispatchNotification)({
                    userId: member.userId,
                    type: 'correction',
                    projectId: comment.projectId,
                    title: `${authorName} flagged a correction`,
                    body: humanBody,
                    metadata: baseMetadata,
                    email: {
                        subject: `${authorName} flagged a correction on LumaWay`,
                        html: (0, notificationDispatcher_1.buildNotificationEmail)({
                            heading: 'Correction flagged',
                            body: `<strong>${authorName}</strong> flagged a correction: <em>"${humanBody}"</em>`,
                            ctaLabel: 'Review Correction',
                            ctaUrl,
                        }),
                        text: `${authorName} flagged a correction: "${humanBody}"\n\nReview it here: ${ctaUrl}`,
                    },
                });
                notifiedUserIds.add(member.userId);
            }
        }
    }
    // ── 4. Announcement notification ──────────────────────────
    if (comment.type === 'announcement') {
        const members = await adapters_1.db
            .select({ userId: schema_1.projectMembers.userId })
            .from(schema_1.projectMembers)
            .where((0, drizzle_orm_1.eq)(schema_1.projectMembers.projectId, comment.projectId));
        for (const member of members) {
            if (!notifiedUserIds.has(member.userId)) {
                await (0, notificationDispatcher_1.dispatchNotification)({
                    userId: member.userId,
                    type: 'announcement',
                    projectId: comment.projectId,
                    title: `${authorName} posted an announcement`,
                    body: humanBody,
                    metadata: {
                        projectId: comment.projectId,
                        commentId: comment.id,
                    },
                    email: {
                        subject: `${authorName} posted an announcement on LumaWay`,
                        html: (0, notificationDispatcher_1.buildNotificationEmail)({
                            heading: 'New announcement',
                            body: `<strong>${authorName}</strong> posted an announcement: <em>"${humanBody}"</em>`,
                            ctaLabel: 'View Announcement',
                            ctaUrl,
                        }),
                        text: `${authorName} posted an announcement: "${humanBody}"\n\nView it here: ${ctaUrl}`,
                    },
                });
                notifiedUserIds.add(member.userId);
            }
        }
    }
    return context;
};
exports.processMentionsAndNotify = processMentionsAndNotify;
