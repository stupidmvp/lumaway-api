import { db } from '../../../adapters';
import { notifications } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook for `create` on `notification-mark-read`.
 *
 * Marks all notifications as read for the authenticated user.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
export const markAllRead = async (context: any) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }

    await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));

    context.result = { message: 'All notifications marked as read' };
    return context;
};

