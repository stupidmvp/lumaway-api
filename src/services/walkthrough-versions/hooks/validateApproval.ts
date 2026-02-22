import { HookContext } from '@flex-donec/core';
import { db } from '../../../adapters';
import { walkthroughVersions, walkthroughs, projects, walkthroughApprovals } from '../../../db/schema';
import { eq, and, count } from 'drizzle-orm';

/**
 * Hook to enforce approval workflow for walkthrough versions.
 * 
 * - Prevents publishing if approval is required and status is not 'approved'.
 * - Records timestamps and user info on status transitions.
 * - [NEW] Reviewer-based multi-approval system (GitHub-like).
 */
export const validateApproval = async (context: HookContext) => {
    const { data, method, params } = context;
    const id = (context as any).id || (params as any)?.route?.id;
    const userId = params?.user?.id;

    if (!params?.provider) return context; // Internal calls bypass

    // 1. Resolve Project & Settings
    let projectId: string | undefined;

    if (method === 'create') {
        const walkthroughId = data.walkthroughId;
        if (walkthroughId) {
            const [wt] = await db
                .select({ projectId: walkthroughs.projectId })
                .from(walkthroughs)
                .where(eq(walkthroughs.id, walkthroughId))
                .limit(1);
            projectId = wt?.projectId;
        }
    } else if (id) {
        const [version] = await db
            .select({ projectId: walkthroughs.projectId })
            .from(walkthroughVersions)
            .innerJoin(walkthroughs, eq(walkthroughVersions.walkthroughId, walkthroughs.id))
            .where(eq(walkthroughVersions.id, id as string))
            .limit(1);
        projectId = version?.projectId;
    }

    if (!projectId) return context;

    const [project] = await db
        .select({ settings: projects.settings })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

    const settings = (project?.settings as any) || {};
    const approvalRequired = settings.approvalRequired === true;
    const minApprovals = settings.minApprovals || 1;
    const reviewerUserIds = settings.reviewerUserIds || [];

    // 2. Handle Status Transitions & Recording
    if (data.status) {
        if (data.status === 'pending_approval') {
            data.requestedApprovalAt = new Date();
        } else if (data.status === 'approved') {
            // Check if user is allowed to approve
            const isReviewer = reviewerUserIds.length === 0 || reviewerUserIds.includes(userId);
            const role = params.projectMembership?.role;
            const isOwner = role === 'owner';

            // If reviewers are defined, only they can approve. 
            // Owners can ALWAYS approve regardless of the list (GitHub behavior).
            if (!isReviewer && !isOwner) {
                throw new Error('Usted no está en la lista de revisores autorizados para este proyecto');
            }

            // Register the approval in the tracking table
            if (id && userId) {
                // Check if already approved by this user
                const [existing] = await db.select()
                    .from(walkthroughApprovals)
                    .where(and(
                        eq(walkthroughApprovals.versionId, id as string),
                        eq(walkthroughApprovals.userId, userId as string)
                    ))
                    .limit(1);

                if (!existing) {
                    await db.insert(walkthroughApprovals).values({
                        versionId: id as string,
                        userId: userId as string,
                    });
                }

                // Count total distinct approvals
                const [result] = await db.select({ total: count() })
                    .from(walkthroughApprovals)
                    .where(eq(walkthroughApprovals.versionId, id as string));

                const totalApprovals = result?.total || 0;

                if (totalApprovals < minApprovals) {
                    // Not enough approvals yet — keep it as pending
                    data.status = 'pending_approval';
                    // We don't set approvedAt yet
                } else {
                    // Threshold met!
                    data.approvedAt = new Date();
                    data.approvedBy = userId; // Last person to approve
                }
            }
        } else if (data.status === 'published') {
            data.isPublished = true;
        }
    }

    // 3. Handle Publishing Restriction
    if (data.isOriginalPublishAction || data.isPublished === true) {
        if (approvalRequired) {
            let currentStatus = data.status;

            if (method === 'patch' && !currentStatus) {
                const [version] = await db
                    .select({ status: walkthroughVersions.status })
                    .from(walkthroughVersions)
                    .where(eq(walkthroughVersions.id, id as string))
                    .limit(1);
                currentStatus = version?.status;
            }

            if (currentStatus !== 'approved' && currentStatus !== 'published') {
                throw new Error('Este recorrido requiere ser aprobado por los revisores antes de publicarse');
            }

            data.status = 'published';
        } else {
            data.status = 'published';
        }
    }

    return context;
};
