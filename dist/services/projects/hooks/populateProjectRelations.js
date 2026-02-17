"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateProjectRelations = void 0;
const index_js_1 = require("../../../adapters/index.js");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const populateProjectRelations = async (context) => {
    const { result } = context;
    if (!result)
        return context;
    // Handle both single result and arrays
    const items = Array.isArray(result) ? result : result.data || [result];
    for (const item of items) {
        // Populate organization
        if (item.organizationId) {
            const [organization] = await index_js_1.db
                .select({
                id: schema_1.organizations.id,
                name: schema_1.organizations.name,
                slug: schema_1.organizations.slug
            })
                .from(schema_1.organizations)
                .where((0, drizzle_orm_1.eq)(schema_1.organizations.id, item.organizationId));
            if (organization) {
                item.organization = organization;
            }
        }
        // Populate owner
        if (item.ownerId) {
            const [owner] = await index_js_1.db
                .select({
                id: schema_1.users.id,
                firstName: schema_1.users.firstName,
                lastName: schema_1.users.lastName,
                email: schema_1.users.email,
                avatar: schema_1.users.avatar
            })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, item.ownerId));
            if (owner) {
                item.owner = owner;
            }
        }
        // Populate walkthroughs count
        const [walkthroughsCount] = await index_js_1.db
            .select({
            count: (0, drizzle_orm_1.sql) `count(*)`
        })
            .from(schema_1.walkthroughs)
            .where((0, drizzle_orm_1.eq)(schema_1.walkthroughs.projectId, item.id));
        item.walkthroughsCount = Number(walkthroughsCount?.count || 0);
    }
    return context;
};
exports.populateProjectRelations = populateProjectRelations;
