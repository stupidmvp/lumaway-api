import { db } from '../../../adapters';
import { users, organizations, organizationMembers, projects, projectMembers } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook for `create` on `auth-onboarding`.
 *
 * Creates org + optional first project and marks onboarding complete.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
export const completeOnboarding = async (context: any) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }

    const { organizationName, organizationSlug, projectName } = context.data;

    if (!organizationName || !organizationSlug) {
        throw new Error('Organization name and slug are required');
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(organizationSlug)) {
        throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    // Check slug uniqueness
    const existingOrg = await db.select().from(organizations).where(eq(organizations.slug, organizationSlug)).limit(1);
    if (existingOrg.length > 0) {
        throw new Error('This organization slug is already taken');
    }

    // Create the organization
    const [org] = await db.insert(organizations).values({
        name: organizationName,
        slug: organizationSlug,
    }).returning();

    // Add user as owner of the organization
    await db.insert(organizationMembers).values({
        organizationId: org.id,
        userId,
        role: 'owner',
    });

    // Update user's primary organizationId
    await db.update(users).set({
        organizationId: org.id,
    }).where(eq(users.id, userId));

    // Optionally create the first project
    let project = null;
    if (projectName && projectName.trim()) {
        [project] = await db.insert(projects).values({
            organizationId: org.id,
            name: projectName.trim(),
            ownerId: userId,
            status: 'active',
        }).returning();

        // Add user as project owner
        await db.insert(projectMembers).values({
            projectId: project.id,
            userId,
            role: 'owner',
        });
    }

    // Mark onboarding as completed in user preferences
    const [currentUser] = await db.select({ preferences: users.preferences }).from(users).where(eq(users.id, userId)).limit(1);
    const currentPrefs = (currentUser?.preferences as Record<string, any>) || {};
    await db.update(users).set({
        preferences: { ...currentPrefs, onboardingCompleted: true },
    }).where(eq(users.id, userId));

    context.result = {
        organization: org,
        project,
        onboardingCompleted: true,
    };

    return context;
};

