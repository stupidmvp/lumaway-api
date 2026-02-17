"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMembers = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before find: converts `search` query param into `userId[$in]`
 * by searching the users table for matching firstName, lastName, or email.
 * This enables server-side search for project members by user info.
 */
const searchMembers = async (context) => {
    const { query } = context.params;
    if (!query || typeof query.search === 'undefined')
        return context;
    const searchTerm = query.search;
    delete query.search;
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
        return context;
    }
    const pattern = `%${searchTerm.trim()}%`;
    const matchingUsers = await adapters_1.db
        .select({ id: schema_1.users.id })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.users.firstName, pattern), (0, drizzle_orm_1.ilike)(schema_1.users.lastName, pattern), (0, drizzle_orm_1.ilike)(schema_1.users.email, pattern)));
    const matchingUserIds = matchingUsers.map(u => u.id);
    if (matchingUserIds.length === 0) {
        // No matching users — force empty results
        query.userId = '00000000-0000-0000-0000-000000000000';
    }
    else {
        query.userId = { $in: matchingUserIds };
    }
    return context;
};
exports.searchMembers = searchMembers;
