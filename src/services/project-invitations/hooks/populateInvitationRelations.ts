import { db } from '../../../adapters';
import { users, projects } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * After all: populates inviter user info and project name on invitation results.
 */
export const populateInvitationRelations = async (context: any) => {
    const { result } = context;
    if (!result) return context;

    const items = Array.isArray(result) ? result : result.data || [result];

    for (const item of items) {
        // Populate inviter
        if (item.invitedBy) {
            const [inviter] = await db
                .select({
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email,
                    avatar: users.avatar,
                })
                .from(users)
                .where(eq(users.id, item.invitedBy))
                .limit(1);

            if (inviter) {
                item.inviter = inviter;
            }
        }

        // Populate project
        if (item.projectId) {
            const [project] = await db
                .select({
                    id: projects.id,
                    name: projects.name,
                })
                .from(projects)
                .where(eq(projects.id, item.projectId))
                .limit(1);

            if (project) {
                item.project = project;
            }
        }
    }

    return context;
};


