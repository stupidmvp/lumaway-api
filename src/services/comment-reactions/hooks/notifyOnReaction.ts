import { db } from '../../../adapters';
import { comments, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { dispatchNotification, buildNotificationEmail, buildCommentUrl } from '../../../providers/notifications/notificationDispatcher';

/**
 * After hook on create: sends a notification to the comment author
 * when someone reacts to their comment.
 *
 * Social-media rules:
 * - No self-notifications (reacting to your own comment)
 * - Only notifies on NEW reactions (not on toggle-remove)
 */
export const notifyOnReaction = async (context: any) => {
    const reaction = context.result;
    if (!reaction) return context;

    // Skip if this was a toggle-remove (the reaction was already existing and got deleted)
    if (reaction._toggled === 'removed') return context;

    const { commentId, userId: reactorId, emoji } = reaction;
    if (!commentId || !reactorId) return context;

    try {
        // Get the comment to find the author
        const [comment] = await db
            .select({
                userId: comments.userId,
                content: comments.content,
                projectId: comments.projectId,
                targetType: comments.targetType,
                targetId: comments.targetId,
                stepId: comments.stepId,
            })
            .from(comments)
            .where(eq(comments.id, commentId))
            .limit(1);

        if (!comment) return context;

        // No self-notifications
        if (comment.userId === reactorId) return context;

        // Get reactor display name
        const [reactor] = await db
            .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
            .from(users)
            .where(eq(users.id, reactorId))
            .limit(1);

        const reactorName = reactor
            ? [reactor.firstName, reactor.lastName].filter(Boolean).join(' ') || reactor.email
            : 'Someone';

        const commentPreview = (comment.content || '').substring(0, 100);
        const metadata = {
            projectId: comment.projectId,
            commentId,
            targetType: comment.targetType,
            targetId: comment.targetId,
            stepId: comment.stepId,
            reactorId,
            emoji,
        };

        const ctaUrl = buildCommentUrl(metadata);

        await dispatchNotification({
            userId: comment.userId,
            type: 'reaction',
            projectId: comment.projectId,
            title: `${reactorName} reacted ${emoji} to your comment`,
            body: commentPreview,
            metadata,
            email: {
                subject: `${reactorName} reacted to your comment on LumaWay`,
                html: buildNotificationEmail({
                    heading: `${emoji} New reaction on your comment`,
                    body: `<strong>${reactorName}</strong> reacted with ${emoji} to your comment: <em>"${commentPreview}${comment.content.length > 100 ? '...' : ''}"</em>`,
                    ctaLabel: 'View Comment',
                    ctaUrl,
                }),
                text: `${reactorName} reacted ${emoji} to your comment: "${commentPreview}"\n\nView it here: ${ctaUrl}`,
            },
        });
    } catch (error) {
        console.error('[notifyOnReaction] Error creating reaction notification:', error);
        // Non-blocking
    }

    return context;
};

