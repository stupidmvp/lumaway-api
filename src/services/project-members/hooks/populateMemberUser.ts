import { db } from '../../../adapters';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Populates the user object on project member results.
 */
export const populateMemberUser = async (context: any) => {
    const { result } = context;
    if (!result) return context;

    const items = Array.isArray(result) ? result : result.data || [result];

    for (const item of items) {
        if (item.userId) {
            const [user] = await db
                .select({
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email,
                    avatar: users.avatar,
                })
                .from(users)
                .where(eq(users.id, item.userId))
                .limit(1);

            if (user) {
                item.user = user;
            }
        }
    }

    return context;
};

