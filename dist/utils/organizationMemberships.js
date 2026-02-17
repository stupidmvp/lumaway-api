"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserOrgMemberships = getUserOrgMemberships;
exports.getUserOrgRole = getUserOrgRole;
exports.userHasFullOrgAccess = userHasFullOrgAccess;
exports.ensureOrgMembership = ensureOrgMembership;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
/**
 * Get all organization memberships for a user.
 * Returns the membership records with org details.
 */
async function getUserOrgMemberships(storage, userId) {
    const db = storage.db;
    const memberships = await db
        .select({
        id: schema_1.organizationMembers.id,
        organizationId: schema_1.organizationMembers.organizationId,
        userId: schema_1.organizationMembers.userId,
        role: schema_1.organizationMembers.role,
        organizationName: schema_1.organizations.name,
        organizationSlug: schema_1.organizations.slug,
        organizationLogo: schema_1.organizations.logo,
    })
        .from(schema_1.organizationMembers)
        .innerJoin(schema_1.organizations, (0, drizzle_orm_1.eq)(schema_1.organizationMembers.organizationId, schema_1.organizations.id))
        .where((0, drizzle_orm_1.eq)(schema_1.organizationMembers.userId, userId));
    return memberships.map((m) => ({
        id: m.id,
        organizationId: m.organizationId,
        userId: m.userId,
        role: m.role,
        organization: {
            id: m.organizationId,
            name: m.organizationName,
            slug: m.organizationSlug,
            logo: m.organizationLogo,
        },
    }));
}
/**
 * Get the user's role within a specific organization.
 * Returns null if the user is not a member.
 */
async function getUserOrgRole(storage, userId, organizationId) {
    const db = storage.db;
    const [membership] = await db
        .select({ role: schema_1.organizationMembers.role })
        .from(schema_1.organizationMembers)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.organizationMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.organizationMembers.organizationId, organizationId)))
        .limit(1);
    return membership?.role ?? null;
}
/**
 * Check if a user has full access to an organization (owner or admin).
 */
async function userHasFullOrgAccess(storage, userId, organizationId) {
    const role = await getUserOrgRole(storage, userId, organizationId);
    return role === 'owner' || role === 'admin';
}
/**
 * Ensure a user is a member of an organization.
 * If they're already a member, does nothing. If not, adds them with the given role.
 * Returns the membership.
 */
async function ensureOrgMembership(storage, userId, organizationId, role = 'member') {
    const db = storage.db;
    await db.insert(schema_1.organizationMembers)
        .values({
        organizationId,
        userId,
        role,
    })
        .onConflictDoNothing();
}
