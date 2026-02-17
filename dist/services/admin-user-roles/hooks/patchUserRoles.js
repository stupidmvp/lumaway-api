"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchUserRoles = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `patch` on `admin-user-roles`.
 *
 * Replaces all global roles for a specific user.
 * data = { roleIds: string[] }
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
const patchUserRoles = async (context) => {
    const id = context.id || context.params?.route?.id;
    const { roleIds } = context.data;
    if (!Array.isArray(roleIds)) {
        throw new Error('roleIds must be an array');
    }
    // Verify user exists
    const [user] = await adapters_1.db.select({ id: schema_1.users.id }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).limit(1);
    if (!user) {
        throw new Error('User not found');
    }
    // Delete existing roles and insert new ones
    await adapters_1.db.delete(schema_1.userRoles).where((0, drizzle_orm_1.eq)(schema_1.userRoles.userId, id));
    if (roleIds.length > 0) {
        await adapters_1.db.insert(schema_1.userRoles).values(roleIds.map((roleId) => ({ userId: id, roleId })));
    }
    // Return updated roles
    const updatedRoles = await adapters_1.db
        .select({ roleId: schema_1.userRoles.roleId, roleName: schema_1.roles.name })
        .from(schema_1.userRoles)
        .innerJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.userRoles.roleId, schema_1.roles.id))
        .where((0, drizzle_orm_1.eq)(schema_1.userRoles.userId, id));
    context.result = { userId: id, roles: updatedRoles };
    return context;
};
exports.patchUserRoles = patchUserRoles;
