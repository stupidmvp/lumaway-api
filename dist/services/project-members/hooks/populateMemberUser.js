"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateMemberUser = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Populates the user object on project member results.
 */
const populateMemberUser = async (context) => {
    const { result } = context;
    if (!result)
        return context;
    const items = Array.isArray(result) ? result : result.data || [result];
    for (const item of items) {
        if (item.userId) {
            const [user] = await adapters_1.db
                .select({
                id: schema_1.users.id,
                firstName: schema_1.users.firstName,
                lastName: schema_1.users.lastName,
                email: schema_1.users.email,
                avatar: schema_1.users.avatar,
            })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, item.userId))
                .limit(1);
            if (user) {
                item.user = user;
            }
        }
    }
    return context;
};
exports.populateMemberUser = populateMemberUser;
