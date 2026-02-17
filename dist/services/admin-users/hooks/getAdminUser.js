"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminUser = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `get` on `admin-users`.
 *
 * Gets a single user with their global roles.
 *
 * Sets `context.result` to short-circuit the default service get.
 */
const getAdminUser = async (context) => {
    const id = context.id || context.params?.route?.id;
    const [user] = await adapters_1.db
        .select({
        id: schema_1.users.id,
        email: schema_1.users.email,
        firstName: schema_1.users.firstName,
        lastName: schema_1.users.lastName,
        avatar: schema_1.users.avatar,
        status: schema_1.users.status,
        organizationId: schema_1.users.organizationId,
        createdAt: schema_1.users.createdAt,
        updatedAt: schema_1.users.updatedAt,
    })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
        .limit(1);
    if (!user) {
        throw new Error('User not found');
    }
    // Get user roles
    const userRolesList = await adapters_1.db
        .select({
        roleId: schema_1.userRoles.roleId,
        roleName: schema_1.roles.name,
        roleDescription: schema_1.roles.description,
    })
        .from(schema_1.userRoles)
        .innerJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.userRoles.roleId, schema_1.roles.id))
        .where((0, drizzle_orm_1.eq)(schema_1.userRoles.userId, id));
    context.result = {
        ...user,
        globalRoles: userRolesList.map((ur) => ur.roleName),
        roleDetails: userRolesList,
    };
    return context;
};
exports.getAdminUser = getAdminUser;
