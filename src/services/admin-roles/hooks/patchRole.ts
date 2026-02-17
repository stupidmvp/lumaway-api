import { db } from '../../../adapters';
import { roles } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook for `patch` on `admin-roles`.
 *
 * Updates a role's name/description.
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
export const patchRole = async (context: any) => {
    const id = context.id || context.params?.route?.id;
    const { name, description } = context.data;

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const [updated] = await db
        .update(roles)
        .set(updateData)
        .where(eq(roles.id, id))
        .returning();

    if (!updated) {
        throw new Error('Role not found');
    }

    context.result = updated;
    return context;
};

