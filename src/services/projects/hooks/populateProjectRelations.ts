import { HookContext } from '@flex-donec/core';
import { db } from '../../../adapters/index.js';
import { organizations, users, walkthroughs, projectMembers, projectFavorites } from '../../../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const populateProjectRelations = async (context: HookContext) => {
    const { result } = context;

    if (!result) return context;

    // Handle both single result and arrays
    const items = Array.isArray(result) ? result : result.data || [result];

    for (const item of items) {
        // Populate organization
        if (item.organizationId) {
            const [organization] = await db
                .select({
                    id: organizations.id,
                    name: organizations.name,
                    slug: organizations.slug
                })
                .from(organizations)
                .where(eq(organizations.id, item.organizationId));

            if (organization) {
                item.organization = organization;
            }
        }

        // Populate owner
        if (item.ownerId) {
            const [owner] = await db
                .select({
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email,
                    avatar: users.avatar
                })
                .from(users)
                .where(eq(users.id, item.ownerId));

            if (owner) {
                item.owner = owner;
            }
        }

        // Populate walkthroughs count
        const [walkthroughsCount] = await db
            .select({
                count: sql`count(*)`
            })
            .from(walkthroughs)
            .where(eq(walkthroughs.projectId, item.id));

        item.walkthroughsCount = Number(walkthroughsCount?.count || 0);

        // Populate members preview (first 5) and total count
        const [membersCountResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(projectMembers)
            .where(eq(projectMembers.projectId, item.id));

        item.membersCount = Number(membersCountResult?.count || 0);

        const membersPreview = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                avatar: users.avatar,
            })
            .from(projectMembers)
            .innerJoin(users, eq(projectMembers.userId, users.id))
            .where(eq(projectMembers.projectId, item.id))
            .limit(5);

        item.members = membersPreview;

        // Populate isFavorite for the current user
        const currentUser = context.params?.user;
        if (currentUser) {
            const [favorite] = await db
                .select({ id: projectFavorites.id })
                .from(projectFavorites)
                .where(
                    and(
                        eq(projectFavorites.projectId, item.id),
                        eq(projectFavorites.userId, currentUser.id)
                    )
                )
                .limit(1);

            item.isFavorite = !!favorite;
        } else {
            item.isFavorite = false;
        }
    }

    return context;
};
