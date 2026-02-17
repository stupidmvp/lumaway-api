"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMentionsAndNotify = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Extracts @[userId] mention tokens from comment content.
 */
function extractMentionedUserIds(content, authorId) {
    const mentionRegex = /@\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/g;
    const ids = new Set();
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
        const userId = match[1];
        // Don't include self-mentions
        if (userId !== authorId) {
            ids.add(userId);
        }
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
 * creates comment_mentions records, and generates notifications.
 *
 * Also handles:
 * - Reply notifications (comment_reply)
 * - Correction notifications
 * - Announcement notifications (to all project members)
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
    // ── 1. Process @mentions ──────────────────────────────────
    const mentionedUserIds = extractMentionedUserIds(comment.content, authorId);
    for (const mentionedUserId of mentionedUserIds) {
        // Insert mention record
        try {
            await adapters_1.db.insert(schema_1.commentMentions).values({
                commentId: comment.id,
                mentionedUserId,
            });
        }
        catch {
            // Ignore duplicate (unique constraint)
        }
        // Create mention notification
        await adapters_1.db.insert(schema_1.notifications).values({
            userId: mentionedUserId,
            type: 'mention',
            title: `${authorName} mentioned you`,
            body: humanBody,
            metadata: {
                projectId: comment.projectId,
                commentId: comment.id,
                targetType: comment.targetType,
                targetId: comment.targetId,
                stepId: comment.stepId,
            },
        });
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
            await adapters_1.db.insert(schema_1.notifications).values({
                userId: parentComment.userId,
                type: 'comment_reply',
                title: `${authorName} replied to your comment`,
                body: humanBody,
                metadata: {
                    projectId: comment.projectId,
                    commentId: comment.id,
                    parentCommentId: comment.parentId,
                    targetType: comment.targetType,
                    targetId: comment.targetId,
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
                await adapters_1.db.insert(schema_1.notifications).values({
                    userId: member.userId,
                    type: 'correction',
                    title: `${authorName} flagged a correction`,
                    body: humanBody,
                    metadata: {
                        projectId: comment.projectId,
                        commentId: comment.id,
                        targetType: comment.targetType,
                        targetId: comment.targetId,
                        stepId: comment.stepId,
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
                await adapters_1.db.insert(schema_1.notifications).values({
                    userId: member.userId,
                    type: 'announcement',
                    title: `${authorName} posted an announcement`,
                    body: humanBody,
                    metadata: {
                        projectId: comment.projectId,
                        commentId: comment.id,
                    },
                });
                notifiedUserIds.add(member.userId);
            }
        }
    }
    return context;
};
exports.processMentionsAndNotify = processMentionsAndNotify;
