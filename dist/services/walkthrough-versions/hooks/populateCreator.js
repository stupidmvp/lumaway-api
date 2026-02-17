"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateCreator = void 0;
const index_js_1 = require("../../../adapters/index.js");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const populateCreator = async (context) => {
    const { result } = context;
    if (!result)
        return context;
    // Handle both single result and arrays
    const items = Array.isArray(result) ? result : result.data || [result];
    for (const item of items) {
        if (item.createdBy) {
            const [creator] = await index_js_1.db
                .select({
                id: schema_1.users.id,
                firstName: schema_1.users.firstName,
                lastName: schema_1.users.lastName,
                email: schema_1.users.email,
                avatar: schema_1.users.avatar
            })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, item.createdBy));
            if (creator) {
                item.creator = creator;
            }
        }
    }
    return context;
};
exports.populateCreator = populateCreator;
