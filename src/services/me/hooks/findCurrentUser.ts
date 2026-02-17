import { drizzleAdapter, db } from '../../../adapters';
import { users, projects, projectMembers, organizations, organizationMembers } from '../../../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getUserRoles } from '../../../utils/roles';
import { getUserOrgMemberships, ensureOrgMembership } from '../../../utils/organizationMemberships';

/**
 * Helper: fetch ALL organizations in the system (for superadmin).
 * Returns them mapped as synthetic "owner" memberships so the
 * frontend org-switcher works seamlessly.
 */
async function getAllOrganizationsAsMemberships() {
    const allOrgs = await db.select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
    }).from(organizations);

    return allOrgs.map((org: any) => ({
        organizationId: org.id,
        role: 'owner' as const,
        organization: {
            id: org.id,
            name: org.name,
            slug: org.slug,
            logo: org.logo,
        },
    }));
}

/**
 * Before hook for `find` on `me`.
 *
 * Returns the current user profile with global roles,
 * organization memberships, and project memberships.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
export const findCurrentUser = async (context: any) => {
    const user = context.params?.user;
    if (!user) throw new Error('Authentication required');

    // Fetch the user's latest data
    const [freshUser] = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatar: users.avatar,
        status: users.status,
        organizationId: users.organizationId,
        preferences: users.preferences,
        createdAt: users.createdAt,
    }).from(users).where(eq(users.id, user.id)).limit(1);

    if (!freshUser) throw new Error('User not found');

    // Fetch global roles, org memberships, and project memberships in parallel
    let [globalRoles, orgMemberships, projectMemberships] = await Promise.all([
        getUserRoles(drizzleAdapter, freshUser.id),
        getUserOrgMemberships(drizzleAdapter, freshUser.id),
        db.select({
            projectId: projectMembers.projectId,
            role: projectMembers.role,
        })
        .from(projectMembers)
        .where(eq(projectMembers.userId, freshUser.id)),
    ]);

    // Superadmin: return ALL organizations as synthetic owner memberships
    if (globalRoles.includes('superadmin')) {
        const allOrgMemberships = await getAllOrganizationsAsMemberships();

        context.result = {
            ...freshUser,
            globalRoles,
            organizationMemberships: allOrgMemberships.map((m: any) => ({
                organizationId: m.organizationId,
                role: m.role,
                organization: m.organization,
            })),
            projectMemberships: projectMemberships.map((pm: any) => ({
                projectId: pm.projectId,
                role: pm.role,
            })),
        };
        return context;
    }

    // Backfill: reconcile org memberships for legacy users
    if (projectMemberships.length > 0) {
        const existingOrgIds = new Set(orgMemberships.map((m: any) => m.organizationId));
        const userProjectIds = projectMemberships.map((pm: any) => pm.projectId);
        const projectOrgs = await db
            .select({ id: projects.id, organizationId: projects.organizationId })
            .from(projects)
            .where(inArray(projects.id, userProjectIds));

        const missingOrgIds = new Set<string>();
        for (const po of projectOrgs) {
            if (po.organizationId && !existingOrgIds.has(po.organizationId)) {
                missingOrgIds.add(po.organizationId);
            }
        }

        if (missingOrgIds.size > 0) {
            await Promise.all(
                Array.from(missingOrgIds).map(orgId =>
                    ensureOrgMembership(drizzleAdapter, freshUser.id, orgId, 'member')
                )
            );
            orgMemberships = await getUserOrgMemberships(drizzleAdapter, freshUser.id);
        }
    }

    // Backfill: user has legacy organizationId but no org membership
    if (freshUser.organizationId && orgMemberships.length === 0) {
        await ensureOrgMembership(drizzleAdapter, freshUser.id, freshUser.organizationId, 'member');
        orgMemberships = await getUserOrgMemberships(drizzleAdapter, freshUser.id);
    }

    context.result = {
        ...freshUser,
        globalRoles,
        organizationMemberships: orgMemberships.map((m: any) => ({
            organizationId: m.organizationId,
            role: m.role,
            organization: m.organization,
        })),
        projectMemberships: projectMemberships.map((pm: any) => ({
            projectId: pm.projectId,
            role: pm.role,
        })),
    };

    return context;
};

