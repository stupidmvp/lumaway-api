import { drizzleAdapter, db } from '../../../adapters';
import { users, projectMembers } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getUserRoles } from '../../../utils/roles';
import { getUserOrgMemberships } from '../../../utils/organizationMemberships';

/**
 * Before hook for `patch` on `me`.
 *
 * Updates the current user's profile.
 * The `id` parameter is ignored; the authenticated user is always the target.
 *
 * Returns the full user shape (with organizationMemberships, globalRoles,
 * projectMemberships) so the frontend cache stays consistent.
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
export const patchCurrentUser = async (context: any) => {
    const user = context.params?.user;
    if (!user) throw new Error('Authentication required');

    const data = context.data;
    const { firstName, lastName, avatar, preferences } = data;

    const updateData: Record<string, any> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Deep-merge preferences
    if (preferences !== undefined && typeof preferences === 'object') {
        const { userPreferencesSchema } = await import('../../users/users.schema');
        const parsed = userPreferencesSchema.safeParse(preferences);
        if (!parsed.success) {
            const error = new Error('Invalid preferences') as any;
            error.name = 'ValidationError';
            error.details = parsed.error.flatten();
            throw error;
        }

        const [currentUser] = await db
            .select({ preferences: users.preferences })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        const existingPrefs = (currentUser?.preferences as Record<string, any>) || {};
        updateData.preferences = { ...existingPrefs, ...parsed.data };
    }

    const [updated] = await db
        .update(users)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();

    // Fetch relationships so the response matches the GET /me shape
    const [globalRoles, orgMemberships, projectMembershipRows] = await Promise.all([
        getUserRoles(drizzleAdapter, updated.id),
        getUserOrgMemberships(drizzleAdapter, updated.id),
        db.select({
            projectId: projectMembers.projectId,
            role: projectMembers.role,
        })
        .from(projectMembers)
        .where(eq(projectMembers.userId, updated.id)),
    ]);

    // Return without password, with full relationships
    const { password: _, ...safeUser } = updated;
    context.result = {
        ...safeUser,
        globalRoles,
        organizationMemberships: orgMemberships.map((m: any) => ({
            organizationId: m.organizationId,
            role: m.role,
            organization: m.organization,
        })),
        projectMemberships: projectMembershipRows.map((pm: any) => ({
            projectId: pm.projectId,
            role: pm.role,
        })),
    };

    return context;
};

