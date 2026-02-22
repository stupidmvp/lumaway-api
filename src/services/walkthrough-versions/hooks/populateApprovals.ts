import { HookContext } from '@flex-donec/core';
import { db } from '../../../adapters';
import { walkthroughApprovals, users } from '../../../db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * After hook to populate 'approvals' field for walkthrough versions.
 */
export const populateApprovals = async (context: HookContext) => {
    const { result, method } = context;

    if (!result) return context;

    const data = method === 'find' ? result.data : [result];
    const versionIds = data.map((v: any) => v.id).filter(Boolean);

    if (versionIds.length === 0) return context;

    // Fetch all approvals for these versions, joined with user info
    const approvals = await db
        .select({
            id: walkthroughApprovals.id,
            versionId: walkthroughApprovals.versionId,
            userId: walkthroughApprovals.userId,
            createdAt: walkthroughApprovals.createdAt,
            user: {
                id: users.id,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                avatar: users.avatar
            }
        })
        .from(walkthroughApprovals)
        .innerJoin(users, eq(walkthroughApprovals.userId, users.id))
        .where(inArray(walkthroughApprovals.versionId, versionIds));

    // Group approvals by versionId
    const approvalsMap = approvals.reduce((acc: any, approval: any) => {
        if (!acc[approval.versionId]) acc[approval.versionId] = [];
        acc[approval.versionId].push(approval);
        return acc;
    }, {});

    // Attach to versions
    data.forEach((v: any) => {
        v.approvals = approvalsMap[v.id] || [];
    });

    return context;
};
