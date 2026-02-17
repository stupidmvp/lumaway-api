import { db } from '../../../adapters';
import { projectMembers } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * For project-members patch/remove: resolve the projectId from the member record
 * and attach it to context so requireProjectAccess can use it.
 */
export const resolveProjectFromMember = async (context: any) => {
    const memberId = (context.id ?? context.params?.route?.id) as string;
    if (!memberId) return context;

    // Only needed if projectId isn't already available
    if (context.data?.projectId || context.params?.query?.projectId) {
        return context;
    }

    const [member] = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.id, memberId))
        .limit(1);

    if (member) {
        if (!context.params) context.params = {};
        if (!context.params.query) context.params.query = {};
        context.params.query.projectId = member.projectId;
    }

    return context;
};

