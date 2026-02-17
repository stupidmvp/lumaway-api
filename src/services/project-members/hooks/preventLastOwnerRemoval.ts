import { db } from '../../../adapters';
import { projectMembers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Prevents removing or downgrading the last owner of a project.
 * Runs as a before hook on remove and patch.
 */
export const preventLastOwnerRemoval = async (context: any) => {
    const memberId = (context.id ?? context.params?.route?.id) as string;
    if (!memberId) return context;

    const [member] = await db
        .select()
        .from(projectMembers)
        .where(eq(projectMembers.id, memberId))
        .limit(1);

    if (!member) throw new Error('Member not found');

    // Only check if we're modifying an owner
    if (member.role !== 'owner') return context;

    // For patch: only check if role is being changed
    if (context.method === 'patch' && context.data?.role === 'owner') return context;

    // Count other owners in the project
    const owners = await db
        .select()
        .from(projectMembers)
        .where(
            and(
                eq(projectMembers.projectId, member.projectId),
                eq(projectMembers.role, 'owner')
            )
        );

    if (owners.length <= 1) {
        throw new Error('Cannot remove or downgrade the last owner of a project');
    }

    return context;
};

