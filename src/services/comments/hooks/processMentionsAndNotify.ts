import { db } from '../../../adapters';
import { commentMentions, users, comments, projectMembers } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import {
    dispatchNotification,
    buildNotificationEmail,
    buildCommentUrl,
} from '../../../providers/notifications/notificationDispatcher';

/**
 * Extracts ALL @[userId] mention tokens from comment content (including self-mentions).
 */
function extractAllMentionedUserIds(content: string): string[] {
    const mentionRegex = /@\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/g;
    const ids = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(content)) !== null) {
        if (match[1]) ids.add(match[1]);
    }

    return Array.from(ids);
}

/**
 * Replaces all @[userId] tokens in content with @FirstName LastName for human-readable display.
 */
async function humanizeContent(content: string): Promise<string> {
    const mentionRegex = /@\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/g;
    const matches = [...content.matchAll(mentionRegex)];
    if (matches.length === 0) return content;

    // Collect unique user IDs
    const userIds = [...new Set(matches.map((m) => m[1]))];

    // Batch-fetch names
    const nameMap = new Map<string, string>();
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
async function getUserDisplayName(userId: string): Promise<string> {
    const [user] = await db
        .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) return 'Someone';
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
export const processMentionsAndNotify = async (context: any) => {
    const comment = context.result;
    if (!comment) return context;

    const authorId = comment.userId;
    const authorName = await getUserDisplayName(authorId);

    // Humanize content for notification body (replace @[uuid] → @Name)
    const humanBody = (await humanizeContent(comment.content)).substring(0, 200);

    // Track who has already been notified to avoid duplicates
    const notifiedUserIds = new Set<string>([authorId]);

    // Build shared metadata and URL for email CTAs
    const baseMetadata = {
        projectId: comment.projectId,
        commentId: comment.id,
        targetType: comment.targetType,
        targetId: comment.targetId,
        stepId: comment.stepId,
    };
    const ctaUrl = buildCommentUrl(baseMetadata);

    // ── 1. Process @mentions ──────────────────────────────────
    const mentionedUserIds = extractAllMentionedUserIds(comment.content);

    for (const mentionedUserId of mentionedUserIds) {
        // Always insert mention record (including self-mentions) for data integrity
        try {
            await db.insert(commentMentions).values({
                commentId: comment.id,
                mentionedUserId,
            });
        } catch {
            // Ignore duplicate (unique constraint)
        }

        // Only send notification if it's NOT a self-mention
        if (mentionedUserId !== authorId) {
            await dispatchNotification({
                userId: mentionedUserId,
                type: 'mention',
                projectId: comment.projectId,
                title: `${authorName} mentioned you`,
                body: humanBody,
                metadata: baseMetadata,
                email: {
                    subject: `${authorName} mentioned you in a comment on LumaWay`,
                    html: buildNotificationEmail({
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
        const [parentComment] = await db
            .select({ userId: comments.userId })
            .from(comments)
            .where(eq(comments.id, comment.parentId))
            .limit(1);

        if (parentComment && !notifiedUserIds.has(parentComment.userId)) {
            await dispatchNotification({
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
                    html: buildNotificationEmail({
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
        const editorsAndOwners = await db
            .select({ userId: projectMembers.userId, role: projectMembers.role })
            .from(projectMembers)
            .where(eq(projectMembers.projectId, comment.projectId));

        for (const member of editorsAndOwners) {
            if ((member.role === 'owner' || member.role === 'editor') && !notifiedUserIds.has(member.userId)) {
                await dispatchNotification({
                    userId: member.userId,
                    type: 'correction',
                    projectId: comment.projectId,
                    title: `${authorName} flagged a correction`,
                    body: humanBody,
                    metadata: baseMetadata,
                    email: {
                        subject: `${authorName} flagged a correction on LumaWay`,
                        html: buildNotificationEmail({
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
        const members = await db
            .select({ userId: projectMembers.userId })
            .from(projectMembers)
            .where(eq(projectMembers.projectId, comment.projectId));

        for (const member of members) {
            if (!notifiedUserIds.has(member.userId)) {
                await dispatchNotification({
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
                        html: buildNotificationEmail({
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
