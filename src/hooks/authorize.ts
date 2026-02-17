import { HookContext } from '@flex-donec/core';
import { getUserPermissions } from '../utils/permissions';
import { defineAbilityFor } from '../abilities/defineAbility';
import { drizzleAdapter } from '../adapters';
import { getUserRoles } from '../utils/roles';
import { getUserOrgMemberships } from '../utils/organizationMemberships';

// Mapping Flex/Express methods to CASL actions
const METHOD_TO_ACTION: Record<string, string> = {
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
export function authorize(subjectName: string) {
    return async (context: HookContext) => {
        const user = context.params.user;
        if (!user) return context;

        // Load ability only once per request
        if (!context.params.ability) {
            const [permissions, globalRoles, orgMemberships] = await Promise.all([
                getUserPermissions(drizzleAdapter, user.id),
                getUserRoles(drizzleAdapter, user.id),
                getUserOrgMemberships(drizzleAdapter, user.id),
            ]);

            context.params.ability = defineAbilityFor(
                user,
                permissions,
                globalRoles,
                orgMemberships.map(m => ({
                    organizationId: m.organizationId,
                    role: m.role as 'owner' | 'admin' | 'member',
                }))
            );
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
