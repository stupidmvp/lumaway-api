import { db } from '../../../adapters';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook for `patch` on `admin-users`.
 *
 * Updates a user's status, name, etc.
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
export const patchAdminUser = async (context: any) => {
    const id = context.id || context.params?.route?.id;
    const { status: newStatus, firstName, lastName } = context.data;

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (newStatus !== undefined) updateData.status = newStatus;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;

    const [updated] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

    if (!updated) {
        throw new Error('User not found');
    }

    const { password: _, ...safeUser } = updated;
    context.result = safeUser;

    return context;
};

