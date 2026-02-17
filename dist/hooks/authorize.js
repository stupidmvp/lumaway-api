"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const permissions_1 = require("../utils/permissions");
const defineAbility_1 = require("../abilities/defineAbility");
const adapters_1 = require("../adapters");
const roles_1 = require("../utils/roles");
const organizationMemberships_1 = require("../utils/organizationMemberships");
// Mapping Flex/Express methods to CASL actions
const METHOD_TO_ACTION = {
    find: 'read',
    get: 'read',
    create: 'create',
    patch: 'update',
    update: 'update',
    remove: 'delete',
    all: 'manage'
};
/**
 * Authorization Hook using CASL
 * Now supports multi-org memberships.
 *
 * Usage: authorize('projects')
 */
function authorize(subjectName) {
    return async (context) => {
        const user = context.params.user;
        if (!user)
            return context;
        // Load ability only once per request
        if (!context.params.ability) {
            const [permissions, globalRoles, orgMemberships] = await Promise.all([
                (0, permissions_1.getUserPermissions)(adapters_1.drizzleAdapter, user.id),
                (0, roles_1.getUserRoles)(adapters_1.drizzleAdapter, user.id),
                (0, organizationMemberships_1.getUserOrgMemberships)(adapters_1.drizzleAdapter, user.id),
            ]);
            context.params.ability = (0, defineAbility_1.defineAbilityFor)(user, permissions, globalRoles, orgMemberships.map(m => ({
                organizationId: m.organizationId,
                role: m.role,
            })));
        }
        const ability = context.params.ability;
        const action = METHOD_TO_ACTION[context.method] || context.method;
        // Verify permission to perform action on subject
        if (!ability.can(action, subjectName)) {
            throw new Error(`You cannot ${action} ${subjectName}`);
        }
        // NOTE: Organization-based filtering for find queries is now handled by
        // filterProjectsByAccess hook instead of CASL constraint injection.
        // This keeps the authorize hook focused on permission checks only.
        return context;
    };
}
