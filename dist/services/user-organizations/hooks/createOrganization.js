"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganization = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `create` on `user-organizations`.
 *
 * Creates a new organization and adds the authenticated user as owner.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
const createOrganization = async (context) => {
    const user = context.params?.user;
    if (!user)
        throw new Error('Authentication required');
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
    const existingOrg = await adapters_1.db.select().from(schema_1.organizations).where((0, drizzle_orm_1.eq)(schema_1.organizations.slug, slug)).limit(1);
    if (existingOrg.length > 0) {
        const error = new Error('This organization slug is already taken');
        error.name = 'ValidationError';
        throw error;
    }
    // Create the organization
    const [org] = await adapters_1.db.insert(schema_1.organizations).values({
        name,
        slug,
    }).returning();
    // Add user as owner of the organization
    await adapters_1.db.insert(schema_1.organizationMembers).values({
        organizationId: org.id,
        userId: user.id,
        role: 'owner',
    });
    context.result = org;
    return context;
};
exports.createOrganization = createOrganization;
