"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyOnReaction = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const notificationDispatcher_1 = require("../../../providers/notifications/notificationDispatcher");
/**
 * After hook on create: sends a notification to the comment author
 * when someone reacts to their comment.
 *
 * Social-media rules:
 * - No self-notifications (reacting to your own comment)
 * - Only notifies on NEW reactions (not on toggle-remove)
 */
const notifyOnReaction = async (context) => {
    const reaction = context.result;
    if (!reaction)
        return context;
    // Skip if this was a toggle-remove (the reaction was already existing and got deleted)
    if (reaction._toggled === 'removed')
        return context;
    const { commentId, userId: reactorId, emoji } = reaction;
    if (!commentId || !reactorId)
        return context;
    try {
        // Get the comment to find the author
        const [comment] = await adapters_1.db
            .select({
            userId: schema_1.comments.userId,
            content: schema_1.comments.content,
            projectId: schema_1.comments.projectId,
            targetType: schema_1.comments.targetType,
            targetId: schema_1.comments.targetId,
            stepId: schema_1.comments.stepId,
        })
            .from(schema_1.comments)
            .where((0, drizzle_orm_1.eq)(schema_1.comments.id, commentId))
            .limit(1);
        if (!comment)
            return context;
        // No self-notifications
        if (comment.userId === reactorId)
            return context;
        // Get reactor display name
        const [reactor] = await adapters_1.db
            .select({ firstName: schema_1.users.firstName, lastName: schema_1.users.lastName, email: schema_1.users.email })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, reactorId))
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
        const ctaUrl = (0, notificationDispatcher_1.buildCommentUrl)(metadata);
        await (0, notificationDispatcher_1.dispatchNotification)({
            userId: comment.userId,
            type: 'reaction',
            projectId: comment.projectId,
            title: `${reactorName} reacted ${emoji} to your comment`,
            body: commentPreview,
            metadata,
            email: {
                subject: `${reactorName} reacted to your comment on LumaWay`,
                html: (0, notificationDispatcher_1.buildNotificationEmail)({
                    heading: `${emoji} New reaction on your comment`,
                    body: `<strong>${reactorName}</strong> reacted with ${emoji} to your comment: <em>"${commentPreview}${comment.content.length > 100 ? '...' : ''}"</em>`,
                    ctaLabel: 'View Comment',
                    ctaUrl,
                }),
                text: `${reactorName} reacted ${emoji} to your comment: "${commentPreview}"\n\nView it here: ${ctaUrl}`,
            },
        });
    }
    catch (error) {
        console.error('[notifyOnReaction] Error creating reaction notification:', error);
        // Non-blocking
    }
    return context;
};
exports.notifyOnReaction = notifyOnReaction;
