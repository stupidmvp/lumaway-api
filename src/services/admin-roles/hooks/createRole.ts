import { db } from '../../../adapters';
import { roles } from '../../../db/schema';

/**
 * Before hook for `create` on `admin-roles`.
 *
 * Creates a new global role.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
export const createRole = async (context: any) => {
    const { name, description } = context.data;
    if (!name) {
        throw new Error('Role name is required');
    }

    try {
        const [created] = await db.insert(roles).values({ name, description }).returning();
        context.result = created;
    } catch (err: any) {
        if (err.code === '23505') {
            throw new Error('A role with this name already exists');
        }
        throw err;
    }

    return context;
};

