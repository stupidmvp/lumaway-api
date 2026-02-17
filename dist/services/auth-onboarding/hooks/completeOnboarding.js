"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeOnboarding = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `create` on `auth-onboarding`.
 *
 * Creates org + optional first project and marks onboarding complete.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
const completeOnboarding = async (context) => {
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
    const existingOrg = await adapters_1.db.select().from(schema_1.organizations).where((0, drizzle_orm_1.eq)(schema_1.organizations.slug, organizationSlug)).limit(1);
    if (existingOrg.length > 0) {
        throw new Error('This organization slug is already taken');
    }
    // Create the organization
    const [org] = await adapters_1.db.insert(schema_1.organizations).values({
        name: organizationName,
        slug: organizationSlug,
    }).returning();
    // Add user as owner of the organization
    await adapters_1.db.insert(schema_1.organizationMembers).values({
        organizationId: org.id,
        userId,
        role: 'owner',
    });
    // Update user's primary organizationId
    await adapters_1.db.update(schema_1.users).set({
        organizationId: org.id,
    }).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
    // Optionally create the first project
    let project = null;
    if (projectName && projectName.trim()) {
        [project] = await adapters_1.db.insert(schema_1.projects).values({
            organizationId: org.id,
            name: projectName.trim(),
            ownerId: userId,
            status: 'active',
        }).returning();
        // Add user as project owner
        await adapters_1.db.insert(schema_1.projectMembers).values({
            projectId: project.id,
            userId,
            role: 'owner',
        });
    }
    // Mark onboarding as completed in user preferences
    const [currentUser] = await adapters_1.db.select({ preferences: schema_1.users.preferences }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId)).limit(1);
    const currentPrefs = currentUser?.preferences || {};
    await adapters_1.db.update(schema_1.users).set({
        preferences: { ...currentPrefs, onboardingCompleted: true },
    }).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
    context.result = {
        organization: org,
        project,
        onboardingCompleted: true,
    };
    return context;
};
exports.completeOnboarding = completeOnboarding;
