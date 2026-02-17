import { drizzleAdapter, db } from '../../../adapters';
import { organizations } from '../../../db/schema';
import { getUserOrgMemberships } from '../../../utils/organizationMemberships';
import { getUserRoles } from '../../../utils/roles';

/**
 * Before hook for `find` on `me-organizations`.
 *
 * Returns all organizations the authenticated user belongs to.
 * Superadmin users see ALL organizations as synthetic owner memberships.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
export const findUserOrganizations = async (context: any) => {
    const user = context.params?.user;
    if (!user) throw new Error('Authentication required');

    // Superadmin: return all organizations
    const globalRoles = await getUserRoles(drizzleAdapter, user.id);
    if (globalRoles.includes('superadmin')) {
        const allOrgs = await db.select({
            id: organizations.id,
            name: organizations.name,
            slug: organizations.slug,
            logo: organizations.logo,
        }).from(organizations);

        context.result = {
            data: allOrgs.map((org: any) => ({
                id: org.id,
                name: org.name,
                slug: org.slug,
                logo: org.logo,
                role: 'owner',
                membershipId: org.id,
            })),
            total: allOrgs.length,
        };

        return context;
    }

    // Regular user: return their memberships
    const memberships = await getUserOrgMemberships(drizzleAdapter, user.id);

    context.result = {
        data: memberships.map(m => ({
            id: m.organization?.id,
            name: m.organization?.name,
            slug: m.organization?.slug,
            logo: m.organization?.logo,
            role: m.role,
            membershipId: m.id,
        })),
        total: memberships.length,
    };

    return context;
};

