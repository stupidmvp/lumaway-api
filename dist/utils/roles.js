"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRoles = getUserRoles;
exports.userHasRole = userHasRole;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
/**
 * Get all roles for a user
 * Returns an array of role names
 */
async function getUserRoles(storage, userId) {
    const db = storage.db;
    const userRoleRecords = await db
        .select({
        roleName: schema_1.roles.name
    })
        .from(schema_1.userRoles)
        .innerJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.userRoles.roleId, schema_1.roles.id))
        .where((0, drizzle_orm_1.eq)(schema_1.userRoles.userId, userId));
    return userRoleRecords.map((r) => r.roleName);
}
/**
 * Check if user has a specific role
 */
async function userHasRole(storage, userId, roleName) {
    const roles = await getUserRoles(storage, userId);
    return roles.includes(roleName);
}
