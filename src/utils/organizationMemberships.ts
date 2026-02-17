import { eq, and } from 'drizzle-orm';
import { DrizzleAdapter } from '@flex-donec/core';
import { organizationMembers, organizations } from '../db/schema';

export interface OrgMembership {
    id: string;
    organizationId: string;
    userId: string;
    role: 'owner' | 'admin' | 'member';
    organization?: {
        id: string;
        name: string;
        slug: string;
        logo: string | null;
    };
}

/**
 * Get all organization memberships for a user.
 * Returns the membership records with org details.
 */
export async function getUserOrgMemberships(
    storage: DrizzleAdapter,
    userId: string
): Promise<OrgMembership[]> {
    const db = (storage as any).db;

    const memberships = await db
        .select({
            id: organizationMembers.id,
            organizationId: organizationMembers.organizationId,
            userId: organizationMembers.userId,
            role: organizationMembers.role,
            organizationName: organizations.name,
            organizationSlug: organizations.slug,
            organizationLogo: organizations.logo,
        })
        .from(organizationMembers)
        .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
        .where(eq(organizationMembers.userId, userId));

    return memberships.map((m: any) => ({
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
export async function getUserOrgRole(
    storage: DrizzleAdapter,
    userId: string,
    organizationId: string
): Promise<'owner' | 'admin' | 'member' | null> {
    const db = (storage as any).db;

    const [membership] = await db
        .select({ role: organizationMembers.role })
        .from(organizationMembers)
        .where(
            and(
                eq(organizationMembers.userId, userId),
                eq(organizationMembers.organizationId, organizationId)
            )
        )
        .limit(1);

    return membership?.role ?? null;
}

/**
 * Check if a user has full access to an organization (owner or admin).
 */
export async function userHasFullOrgAccess(
    storage: DrizzleAdapter,
    userId: string,
    organizationId: string
): Promise<boolean> {
    const role = await getUserOrgRole(storage, userId, organizationId);
    return role === 'owner' || role === 'admin';
}

/**
 * Ensure a user is a member of an organization.
 * If they're already a member, does nothing. If not, adds them with the given role.
 * Returns the membership.
 */
export async function ensureOrgMembership(
    storage: DrizzleAdapter,
    userId: string,
    organizationId: string,
    role: 'owner' | 'admin' | 'member' = 'member'
): Promise<void> {
    const db = (storage as any).db;

    await db.insert(organizationMembers)
        .values({
            organizationId,
            userId,
            role,
        })
        .onConflictDoNothing();
}


