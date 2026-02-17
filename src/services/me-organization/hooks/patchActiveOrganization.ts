import { drizzleAdapter, db } from '../../../adapters';
import { organizations } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getUserOrgMemberships } from '../../../utils/organizationMemberships';
import { getUserRoles } from '../../../utils/roles';

/**
 * Before hook for `patch` on `me-organization`.
 *
 * Updates the active organization.
 * Must be owner or admin of the organization, or superadmin.
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
export const patchActiveOrganization = async (context: any) => {
    const user = context.params?.user;
    if (!user) throw new Error('Authentication required');

    const globalRoles = await getUserRoles(drizzleAdapter, user.id);
    const isSuperAdmin = globalRoles.includes('superadmin');
    const activeOrgId = context.params?.headers?.['x-organization-id'] as string | undefined;

    let targetOrgId: string | undefined;

    if (isSuperAdmin) {
        targetOrgId = activeOrgId;
        if (!targetOrgId) {
            throw new Error('X-Organization-Id header is required for superadmin');
        }
    } else {
        const memberships = await getUserOrgMemberships(drizzleAdapter, user.id);

        const adminMembership = activeOrgId
            ? memberships.find(m => m.organizationId === activeOrgId && (m.role === 'owner' || m.role === 'admin'))
            : memberships.find(m => m.role === 'owner' || m.role === 'admin');

        if (!adminMembership) {
            throw new Error('Authorization: You do not have permission to update any organization');
        }

        targetOrgId = adminMembership.organizationId;
    }

    const data = context.data;
    const { name, slug, logo } = data;
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (logo !== undefined) updateData.logo = logo;

    const [updated] = await db
        .update(organizations)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(organizations.id, targetOrgId!))
        .returning();

    context.result = updated;
    return context;
};

