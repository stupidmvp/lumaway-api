import { drizzleAdapter, db } from '../../../adapters';
import { organizations, organizationMembers, projects, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getUserRoles } from '../../../utils/roles';
import { getUserOrgRole } from '../../../utils/organizationMemberships';

/**
 * Before hook for `remove` on `user-organizations`.
 *
 * Deletes an organization. Only the owner or a superadmin can delete.
 * Cannot delete if the org still has projects.
 *
 * Sets `context.result` to short-circuit the default service remove.
 */
export const removeOrganization = async (context: any) => {
    const user = context.params?.user;
    if (!user) throw new Error('Authentication required');

    const id = context.id || context.params?.route?.id;
    const globalRoles = await getUserRoles(drizzleAdapter, user.id);
    const isSuperAdmin = globalRoles.includes('superadmin');

    // Check if org exists
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    if (!org) {
        const error = new Error('Organization not found');
        error.name = 'NotFoundError';
        throw error;
    }

    // Check permissions: must be owner or superadmin
    if (!isSuperAdmin) {
        const userRole = await getUserOrgRole(drizzleAdapter, user.id, id);
        if (userRole !== 'owner') {
            throw new Error('Authorization: Only organization owners can delete an organization');
        }
    }

    // Check if org has projects — prevent deletion if it does
    const orgProjects = await db.select({ id: projects.id }).from(projects).where(eq(projects.organizationId, id)).limit(1);
    if (orgProjects.length > 0) {
        const error = new Error('Cannot delete an organization that has projects. Please delete or move all projects first.');
        error.name = 'ValidationError';
        throw error;
    }

    // Delete organization members first
    await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, id));

    // Clear legacy organizationId for users that reference this org
    await db.update(users).set({ organizationId: null }).where(eq(users.organizationId, id));

    // Delete the organization
    await db.delete(organizations).where(eq(organizations.id, id));

    context.result = { message: 'Organization deleted successfully' };
    return context;
};

