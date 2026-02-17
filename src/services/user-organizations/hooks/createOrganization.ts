import { db } from '../../../adapters';
import { organizations, organizationMembers } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook for `create` on `user-organizations`.
 *
 * Creates a new organization and adds the authenticated user as owner.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
export const createOrganization = async (context: any) => {
    const user = context.params?.user;
    if (!user) throw new Error('Authentication required');

    const { name, slug } = context.data;

    if (!name || !slug) {
        const error = new Error('Organization name and slug are required');
        error.name = 'ValidationError';
        throw error;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
        const error = new Error('Slug must contain only lowercase letters, numbers, and hyphens');
        error.name = 'ValidationError';
        throw error;
    }

    // Check slug uniqueness
    const existingOrg = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    if (existingOrg.length > 0) {
        const error = new Error('This organization slug is already taken');
        error.name = 'ValidationError';
        throw error;
    }

    // Create the organization
    const [org] = await db.insert(organizations).values({
        name,
        slug,
    }).returning();

    // Add user as owner of the organization
    await db.insert(organizationMembers).values({
        organizationId: org.id,
        userId: user.id,
        role: 'owner',
    });

    context.result = org;
    return context;
};

