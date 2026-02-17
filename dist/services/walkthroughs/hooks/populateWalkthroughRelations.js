"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateWalkthroughRelations = void 0;
const index_js_1 = require("../../../adapters/index.js");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const populateWalkthroughRelations = async (context) => {
    const { result } = context;
    if (!result)
        return context;
    // Handle both single result and arrays
    const items = Array.isArray(result) ? result : result.data || [result];
    for (const item of items) {
        // Populate project
        if (item.projectId) {
            const [project] = await index_js_1.db
                .select({
                id: schema_1.projects.id,
                name: schema_1.projects.name,
                organizationId: schema_1.projects.organizationId
            })
                .from(schema_1.projects)
                .where((0, drizzle_orm_1.eq)(schema_1.projects.id, item.projectId));
            if (project) {
                item.project = project;
            }
        }
        // Populate owner (if walkthrough has ownerId field)
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
    }
    return context;
};
exports.populateWalkthroughRelations = populateWalkthroughRelations;
