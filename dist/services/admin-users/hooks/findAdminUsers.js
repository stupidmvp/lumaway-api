"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAdminUsers = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `find` on `admin-users`.
 *
 * Lists all users (paginated, searchable) for superadmin.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
const findAdminUsers = async (context) => {
    const query = context.params?.query || {};
    const { search, status, $limit, $skip } = query;
    const limit = Math.min(Number($limit) || 25, 100);
    const skip = Number($skip) || 0;
    const userColumns = {
        id: schema_1.users.id,
        email: schema_1.users.email,
        firstName: schema_1.users.firstName,
        lastName: schema_1.users.lastName,
        avatar: schema_1.users.avatar,
        status: schema_1.users.status,
        organizationId: schema_1.users.organizationId,
        createdAt: schema_1.users.createdAt,
        updatedAt: schema_1.users.updatedAt,
    };
    // Build where conditions
    const conditions = [];
    if (status && status !== 'all') {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.users.status, status));
    }
    if (search) {
        const searchTerm = `%${search}%`;
        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.users.email, searchTerm), (0, drizzle_orm_1.ilike)(schema_1.users.firstName, searchTerm), (0, drizzle_orm_1.ilike)(schema_1.users.lastName, searchTerm)));
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    // Fetch users
    const allUsers = whereClause
        ? await adapters_1.db.select(userColumns).from(schema_1.users).where(whereClause).limit(limit).offset(skip)
        : await adapters_1.db.select(userColumns).from(schema_1.users).limit(limit).offset(skip);
    // Fetch roles for each user
    const userIds = allUsers.map((u) => u.id);
    const userRolesMap = {};
    if (userIds.length > 0) {
        const allUserRoles = await adapters_1.db
            .select({
            userId: schema_1.userRoles.userId,
            roleName: schema_1.roles.name,
        })
            .from(schema_1.userRoles)
            .innerJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.userRoles.roleId, schema_1.roles.id))
            .where((0, drizzle_orm_1.inArray)(schema_1.userRoles.userId, userIds));
        for (const ur of allUserRoles) {
            if (!userRolesMap[ur.userId])
                userRolesMap[ur.userId] = [];
            userRolesMap[ur.userId].push(ur.roleName);
        }
    }
    // Fetch org names for users
    const orgMap = {};
    const orgIds = [...new Set(allUsers.map((u) => u.organizationId).filter(Boolean))];
    if (orgIds.length > 0) {
        const orgs = await adapters_1.db
            .select({ id: schema_1.organizations.id, name: schema_1.organizations.name })
            .from(schema_1.organizations)
            .where((0, drizzle_orm_1.inArray)(schema_1.organizations.id, orgIds));
        for (const org of orgs) {
            orgMap[org.id] = org.name;
        }
    }
    // Count total
    const totalResult = whereClause
        ? await adapters_1.db.select({ count: (0, drizzle_orm_1.count)(schema_1.users.id) }).from(schema_1.users).where(whereClause)
        : await adapters_1.db.select({ count: (0, drizzle_orm_1.count)(schema_1.users.id) }).from(schema_1.users);
    const total = Number(totalResult[0]?.count ?? 0);
    context.result = {
        data: allUsers.map((u) => ({
            ...u,
            globalRoles: userRolesMap[u.id] || [],
            organizationName: orgMap[u.organizationId] || null,
        })),
        total,
        limit,
        skip,
    };
    return context;
};
exports.findAdminUsers = findAdminUsers;
