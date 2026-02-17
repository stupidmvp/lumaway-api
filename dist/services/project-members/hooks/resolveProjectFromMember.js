"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProjectFromMember = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * For project-members patch/remove: resolve the projectId from the member record
 * and attach it to context so requireProjectAccess can use it.
 */
const resolveProjectFromMember = async (context) => {
    const memberId = (context.id ?? context.params?.route?.id);
    if (!memberId)
        return context;
    // Only needed if projectId isn't already available
    if (context.data?.projectId || context.params?.query?.projectId) {
        return context;
    }
    const [member] = await adapters_1.db
        .select({ projectId: schema_1.projectMembers.projectId })
        .from(schema_1.projectMembers)
        .where((0, drizzle_orm_1.eq)(schema_1.projectMembers.id, memberId))
        .limit(1);
    if (member) {
        if (!context.params)
            context.params = {};
        if (!context.params.query)
            context.params.query = {};
        context.params.query.projectId = member.projectId;
    }
    return context;
};
exports.resolveProjectFromMember = resolveProjectFromMember;
