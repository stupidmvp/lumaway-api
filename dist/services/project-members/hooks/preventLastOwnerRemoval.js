"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preventLastOwnerRemoval = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Prevents removing or downgrading the last owner of a project.
 * Runs as a before hook on remove and patch.
 */
const preventLastOwnerRemoval = async (context) => {
    const memberId = (context.id ?? context.params?.route?.id);
    if (!memberId)
        return context;
    const [member] = await adapters_1.db
        .select()
        .from(schema_1.projectMembers)
        .where((0, drizzle_orm_1.eq)(schema_1.projectMembers.id, memberId))
        .limit(1);
    if (!member)
        throw new Error('Member not found');
    // Only check if we're modifying an owner
    if (member.role !== 'owner')
        return context;
    // For patch: only check if role is being changed
    if (context.method === 'patch' && context.data?.role === 'owner')
        return context;
    // Count other owners in the project
    const owners = await adapters_1.db
        .select()
        .from(schema_1.projectMembers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.projectMembers.projectId, member.projectId), (0, drizzle_orm_1.eq)(schema_1.projectMembers.role, 'owner')));
    if (owners.length <= 1) {
        throw new Error('Cannot remove or downgrade the last owner of a project');
    }
    return context;
};
exports.preventLastOwnerRemoval = preventLastOwnerRemoval;
