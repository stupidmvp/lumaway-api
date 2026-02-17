"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineAbilityFor = defineAbilityFor;
const ability_1 = require("@casl/ability");
/**
 * Define CASL abilities for a user based on:
 * - Global roles (superadmin) from user_roles
 * - Organization memberships from organization_members
 * - Legacy permissions from role_permissions (for backward compat)
 *
 * NOTE: Project-level access is NOT handled by CASL.
 * It's handled by the requireProjectAccess hook and filterProjectsByAccess.
 */
function defineAbilityFor(user, permissions, globalRoles, orgMemberships = []) {
    const { can, cannot, build } = new ability_1.AbilityBuilder(ability_1.createMongoAbility);
    if (!user)
        return build();
    // ═══ GLOBAL: Superadmin ═══
    if (globalRoles.includes('superadmin')) {
        can('manage', 'all');
        return build();
    }
    // ═══ ORGANIZATION-LEVEL ABILITIES ═══
    for (const membership of orgMemberships) {
        const orgId = membership.organizationId;
        if (membership.role === 'owner') {
            // Full org control
            can('manage', 'organizations', { id: orgId });
            can('manage', 'organization_members', { organizationId: orgId });
            can('manage', 'projects', { organizationId: orgId });
            can('create', 'projects', { organizationId: orgId });
            can('manage', 'project_invitations', { organizationId: orgId });
        }
        if (membership.role === 'admin') {
            // Org admin — manage projects & members, read/update org settings
            can('read', 'organizations', { id: orgId });
            can('update', 'organizations', { id: orgId });
            can('manage', 'organization_members', { organizationId: orgId });
            can('manage', 'projects', { organizationId: orgId });
            can('create', 'projects', { organizationId: orgId });
            can('manage', 'project_invitations', { organizationId: orgId });
        }
        if (membership.role === 'member') {
            // Minimal org access — just context, can read org info
            can('read', 'organizations', { id: orgId });
            // Project access is controlled by project_members, not CASL
        }
    }
    // ═══ LEGACY PERMISSION MAPPING ═══
    // Support existing role_permissions for fine-grained module access
    permissions.forEach(permission => {
        const parts = permission.split(':');
        const module = parts[0];
        const action = parts[1];
        const scope = parts[2] || 'company';
        let constraint = {};
        if (scope === 'own') {
            constraint = { ownerId: user.id };
        }
        else if (scope === 'all') {
            constraint = {};
        }
        if (action === 'read')
            can('read', module, constraint);
        if (action === 'create')
            can('create', module, constraint);
        if (action === 'update')
            can('update', module, constraint);
        if (action === 'delete')
            can('delete', module, constraint);
        if (action === 'all')
            can('manage', module, constraint);
        if (module === 'users' && action === 'read-profile') {
            can('read', 'users', { id: user.id });
        }
    });
    // ═══ USER-LEVEL DEFAULTS ═══
    // Every user can manage their own profile
    can('read', 'users', { id: user.id });
    can('update', 'users', { id: user.id });
    cannot('delete', 'users', { id: user.id });
    // Every user can read their own notifications
    can('manage', 'notifications', { userId: user.id });
    return build();
}
