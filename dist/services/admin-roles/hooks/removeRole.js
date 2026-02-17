"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeRole = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `remove` on `admin-roles`.
 *
 * Soft-deletes a role and cleans up associations.
 * Cannot delete the superadmin role.
 *
 * Sets `context.result` to short-circuit the default service remove.
 */
const removeRole = async (context) => {
    const id = context.id || context.params?.route?.id;
    // Prevent deleting the superadmin role
    const [role] = await adapters_1.db.select().from(schema_1.roles).where((0, drizzle_orm_1.eq)(schema_1.roles.id, id)).limit(1);
    if (!role) {
        throw new Error('Role not found');
    }
    if (role.name === 'superadmin') {
        throw new Error('Cannot delete the superadmin role');
    }
    // Soft delete
    await adapters_1.db
        .update(schema_1.roles)
        .set({ deletedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.roles.id, id));
    // Clean up user-role and role-permission associations
    await adapters_1.db.delete(schema_1.userRoles).where((0, drizzle_orm_1.eq)(schema_1.userRoles.roleId, id));
    await adapters_1.db.delete(schema_1.rolePermissions).where((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, id));
    context.result = { message: 'Role deleted' };
    return context;
};
exports.removeRole = removeRole;
