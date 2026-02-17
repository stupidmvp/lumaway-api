import { drizzleAdapter, db } from '../../../adapters';
import { organizations } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getUserOrgMemberships } from '../../../utils/organizationMemberships';
import { getUserRoles } from '../../../utils/roles';

/**
 * Before hook for `find` on `me-organization`.
 *
 * Returns the user's active organization.
 * Uses `X-Organization-Id` header when present; otherwise falls back to highest-role org.
 * Superadmin can access any organization.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
export const findActiveOrganization = async (context: any) => {
    const user = context.params?.user;
    if (!user) throw new Error('Authentication required');

    const globalRoles = await getUserRoles(drizzleAdapter, user.id);
    const isSuperAdmin = globalRoles.includes('superadmin');
    const activeOrgId = context.params?.headers?.['x-organization-id'] as string | undefined;

    // Superadmin: can access any organization directly
    if (isSuperAdmin) {
        if (activeOrgId) {
            const [org] = await db.select({
                id: organizations.id,
                name: organizations.name,
                slug: organizations.slug,
                logo: organizations.logo,
            }).from(organizations).where(eq(organizations.id, activeOrgId)).limit(1);

            if (org) {
                context.result = { ...org, role: 'owner' };
                return context;
            }
        }

        // Fallback: first org in system
        const [firstOrg] = await db.select({
            id: organizations.id,
            name: organizations.name,
            slug: organizations.slug,
            logo: organizations.logo,
        }).from(organizations).limit(1);

        context.result = firstOrg ? { ...firstOrg, role: 'owner' } : null;
        return context;
    }

    const memberships = await getUserOrgMemberships(drizzleAdapter, user.id);

    if (memberships.length === 0) {
        context.result = null;
        return context;
    }

    // If the frontend sends the active org header, use it
    let target = activeOrgId
        ? memberships.find(m => m.organizationId === activeOrgId)
        : undefined;

    // Fallback: highest-role org
    if (!target) {
        const priority = ['owner', 'admin', 'member'];
        const sorted = [...memberships].sort(
            (a, b) => priority.indexOf(a.role) - priority.indexOf(b.role)
        );
        target = sorted[0];
    }

    const org = target!.organization;
    context.result = {
        id: org?.id,
        name: org?.name,
        slug: org?.slug,
        logo: org?.logo,
        role: target!.role,
    };

    return context;
};

