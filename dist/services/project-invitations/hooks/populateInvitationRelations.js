"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateInvitationRelations = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * After all: populates inviter user info and project name on invitation results.
 */
const populateInvitationRelations = async (context) => {
    const { result } = context;
    if (!result)
        return context;
    const items = Array.isArray(result) ? result : result.data || [result];
    for (const item of items) {
        // Populate inviter
        if (item.invitedBy) {
            const [inviter] = await adapters_1.db
                .select({
                id: schema_1.users.id,
                firstName: schema_1.users.firstName,
                lastName: schema_1.users.lastName,
                email: schema_1.users.email,
                avatar: schema_1.users.avatar,
            })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, item.invitedBy))
                .limit(1);
            if (inviter) {
                item.inviter = inviter;
            }
        }
        // Populate project
        if (item.projectId) {
            const [project] = await adapters_1.db
                .select({
                id: schema_1.projects.id,
                name: schema_1.projects.name,
            })
                .from(schema_1.projects)
                .where((0, drizzle_orm_1.eq)(schema_1.projects.id, item.projectId))
                .limit(1);
            if (project) {
                item.project = project;
            }
        }
    }
    return context;
};
exports.populateInvitationRelations = populateInvitationRelations;
