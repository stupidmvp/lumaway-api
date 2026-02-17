import { HookContext } from '@flex-donec/core';
import { db } from '../../../adapters/index.js';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const populateCreator = async (context: HookContext) => {
    const { result } = context;

    if (!result) return context;

    // Handle both single result and arrays
    const items = Array.isArray(result) ? result : result.data || [result];

    for (const item of items) {
        if (item.createdBy) {
            const [creator] = await db
                .select({
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email,
                    avatar: users.avatar
                })
                .from(users)
                .where(eq(users.id, item.createdBy));

            if (creator) {
                item.creator = creator;
            }
        }
    }

    return context;
};
