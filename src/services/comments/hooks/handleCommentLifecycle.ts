import { db } from '../../../adapters';
import { comments } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import {
    dispatchNotification,
    buildNotificationEmail,
    buildCommentUrl,
} from '../../../providers/notifications/notificationDispatcher';

/**
 * Before hook on patch: handles lifecycle transitions for comments.
 *
 * - If `status` is being changed to 'archived': sets archivedAt/archivedBy
 * - If `status` is being changed to 'deleted': sets deletedAt/deletedBy
 * - If `status` is being changed to 'active' (restore): clears archive/delete timestamps
 * - If `content` is being changed: sets isEdited = true
 * - If `isResolved` is being set to true: creates a notification for the comment author
 */
export const handleCommentLifecycle = async (context: any) => {
    const user = context.params?.user;
    const patchData = context.data;
    if (!patchData || !user) return context;

    const commentId = (context.id ?? context.params?.route?.id) as string;

    // Handle status transitions
    if (patchData.status === 'archived') {
        patchData.archivedAt = new Date();
        patchData.archivedBy = user.id;
        // Keep deletedAt/deletedBy unchanged
    } else if (patchData.status === 'deleted') {
        patchData.deletedAt = new Date();
        patchData.deletedBy = user.id;
        // Keep archivedAt/archivedBy unchanged
    } else if (patchData.status === 'active') {
        // Restoring: clear both archive and delete timestamps
        patchData.archivedAt = null;
        patchData.archivedBy = null;
        patchData.deletedAt = null;
        patchData.deletedBy = null;
    }

    // Mark as edited if content is being changed
    if (patchData.content !== undefined) {
        patchData.isEdited = true;
    }

    // Set updatedAt
    patchData.updatedAt = new Date();

    return context;
};

/**
 * After hook on patch: handles post-lifecycle notifications.
 *
 * - When `isResolved` transitions to true, notify the correction author.
 * - When archiving a root comment, cascade archive to its replies.
 */
export const handleLifecycleNotifications = async (context: any) => {
    const result = context.result;
    const patchData = context.data;
    const user = context.params?.user;

    if (!result || !user) return context;

    // ── Notify on correction resolved ─────────────────────────
    if (patchData?.isResolved === true && result.type === 'correction' && result.userId !== user.id) {
        const resolverName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
        const bodyPreview = result.content?.substring(0, 200) || '';
        const metadata = {
            projectId: result.projectId,
            commentId: result.id,
            resolvedBy: user.id,
            targetType: result.targetType,
            targetId: result.targetId,
        };
        const ctaUrl = buildCommentUrl(metadata);

        await dispatchNotification({
            userId: result.userId,
            type: 'comment_resolved',
            projectId: result.projectId,
            title: `${resolverName} resolved your correction`,
            body: bodyPreview,
            metadata,
            email: {
                subject: `${resolverName} resolved your correction on LumaWay`,
                html: buildNotificationEmail({
                    heading: 'Correction resolved',
                    body: `<strong>${resolverName}</strong> marked your correction as resolved: <em>"${bodyPreview}"</em>`,
                    ctaLabel: 'View Correction',
                    ctaUrl,
                }),
                text: `${resolverName} resolved your correction: "${bodyPreview}"\n\nView it here: ${ctaUrl}`,
            },
        });
    }

    // ── Cascade archive to replies ────────────────────────────
    if (patchData?.status === 'archived' && !result.parentId) {
        await cascadeArchiveReplies(result.id, user.id);
    }

    // ── Cascade soft-delete to replies ────────────────────────
    if (patchData?.status === 'deleted' && !result.parentId) {
        await cascadeDeleteReplies(result.id, user.id);
    }

    return context;
};

/**
 * Recursively archives all active replies of a comment.
 */
async function cascadeArchiveReplies(parentId: string, archivedByUserId: string) {
    const replies = await db
        .select({ id: comments.id })
        .from(comments)
        .where(eq(comments.parentId, parentId));

    for (const reply of replies) {
        await db.update(comments).set({
            status: 'archived',
            archivedAt: new Date(),
            archivedBy: archivedByUserId,
            updatedAt: new Date(),
        }).where(eq(comments.id, reply.id));

        // Recurse into nested replies
        await cascadeArchiveReplies(reply.id, archivedByUserId);
    }
}

/**
 * Recursively soft-deletes all replies of a comment.
 */
async function cascadeDeleteReplies(parentId: string, deletedByUserId: string) {
    const replies = await db
        .select({ id: comments.id })
        .from(comments)
        .where(eq(comments.parentId, parentId));

    for (const reply of replies) {
        await db.update(comments).set({
            status: 'deleted',
            deletedAt: new Date(),
            deletedBy: deletedByUserId,
            updatedAt: new Date(),
        }).where(eq(comments.id, reply.id));

        // Recurse into nested replies
        await cascadeDeleteReplies(reply.id, deletedByUserId);
    }
}


