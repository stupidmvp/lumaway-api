import { db } from '../../../adapters';
import { users } from '../../../db/schema';
import { or, ilike } from 'drizzle-orm';

/**
 * Before find: converts `search` query param into `userId[$in]` 
 * by searching the users table for matching firstName, lastName, or email.
 * This enables server-side search for project members by user info.
 */
export const searchMembers = async (context: any) => {
    const { query } = context.params;

    if (!query || typeof query.search === 'undefined') return context;

    const searchTerm = query.search;
    delete query.search;

    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
        return context;
    }

    const pattern = `%${searchTerm.trim()}%`;

    const matchingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(
            or(
                ilike(users.firstName, pattern),
                ilike(users.lastName, pattern),
                ilike(users.email, pattern)
            )
        );

    const matchingUserIds = matchingUsers.map(u => u.id);

    if (matchingUserIds.length === 0) {
        // No matching users — force empty results
        query.userId = '00000000-0000-0000-0000-000000000000';
    } else {
        query.userId = { $in: matchingUserIds };
    }

    return context;
};


