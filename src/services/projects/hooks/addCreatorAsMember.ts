import { HookContext } from '@flex-donec/core';
import { db } from '../../../adapters';
import { projectMembers } from '../../../db/schema';

/**
 * After a project is created, automatically add the creator as an 'owner' member.
 * Runs as an after:create hook on the projects service.
 */
export const addCreatorAsMember = async (context: HookContext) => {
    const { result, params } = context;
    const user = params?.user;

    if (!result || !user) return context;

    const projectId = result.id;

    try {
        await db.insert(projectMembers).values({
            projectId,
            userId: user.id,
            role: 'owner',
        });
    } catch (error) {
        console.error('Error adding creator as project member:', error);
        // Non-blocking: project is already created, membership is best-effort
    }

    return context;
};


