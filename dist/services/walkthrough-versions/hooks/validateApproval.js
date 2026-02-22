"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApproval = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Hook to enforce approval workflow for walkthrough versions.
 *
 * - Prevents publishing if approval is required and status is not 'approved'.
 * - Records timestamps and user info on status transitions.
 * - [NEW] Reviewer-based multi-approval system (GitHub-like).
 */
const validateApproval = async (context) => {
    const { data, method, params } = context;
    const id = context.id || params?.route?.id;
    const userId = params?.user?.id;
    if (!params?.provider)
        return context; // Internal calls bypass
    // 1. Resolve Project & Settings
    let projectId;
    if (method === 'create') {
        const walkthroughId = data.walkthroughId;
        if (walkthroughId) {
            const [wt] = await adapters_1.db
                .select({ projectId: schema_1.walkthroughs.projectId })
                .from(schema_1.walkthroughs)
                .where((0, drizzle_orm_1.eq)(schema_1.walkthroughs.id, walkthroughId))
                .limit(1);
            projectId = wt?.projectId;
        }
    }
    else if (id) {
        const [version] = await adapters_1.db
            .select({ projectId: schema_1.walkthroughs.projectId })
            .from(schema_1.walkthroughVersions)
            .innerJoin(schema_1.walkthroughs, (0, drizzle_orm_1.eq)(schema_1.walkthroughVersions.walkthroughId, schema_1.walkthroughs.id))
            .where((0, drizzle_orm_1.eq)(schema_1.walkthroughVersions.id, id))
            .limit(1);
        projectId = version?.projectId;
    }
    if (!projectId)
        return context;
    const [project] = await adapters_1.db
        .select({ settings: schema_1.projects.settings })
        .from(schema_1.projects)
        .where((0, drizzle_orm_1.eq)(schema_1.projects.id, projectId))
        .limit(1);
    const settings = project?.settings || {};
    const approvalRequired = settings.approvalRequired === true;
    const minApprovals = settings.minApprovals || 1;
    const reviewerUserIds = settings.reviewerUserIds || [];
    // 2. Handle Status Transitions & Recording
    if (data.status) {
        if (data.status === 'pending_approval') {
            data.requestedApprovalAt = new Date();
        }
        else if (data.status === 'approved') {
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
                const [existing] = await adapters_1.db.select()
                    .from(schema_1.walkthroughApprovals)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.walkthroughApprovals.versionId, id), (0, drizzle_orm_1.eq)(schema_1.walkthroughApprovals.userId, userId)))
                    .limit(1);
                if (!existing) {
                    await adapters_1.db.insert(schema_1.walkthroughApprovals).values({
                        versionId: id,
                        userId: userId,
                    });
                }
                // Count total distinct approvals
                const [result] = await adapters_1.db.select({ total: (0, drizzle_orm_1.count)() })
                    .from(schema_1.walkthroughApprovals)
                    .where((0, drizzle_orm_1.eq)(schema_1.walkthroughApprovals.versionId, id));
                const totalApprovals = result?.total || 0;
                if (totalApprovals < minApprovals) {
                    // Not enough approvals yet — keep it as pending
                    data.status = 'pending_approval';
                    // We don't set approvedAt yet
                }
                else {
                    // Threshold met!
                    data.approvedAt = new Date();
                    data.approvedBy = userId; // Last person to approve
                }
            }
        }
        else if (data.status === 'published') {
            data.isPublished = true;
        }
    }
    // 3. Handle Publishing Restriction
    if (data.isOriginalPublishAction || data.isPublished === true) {
        if (approvalRequired) {
            let currentStatus = data.status;
            if (method === 'patch' && !currentStatus) {
                const [version] = await adapters_1.db
                    .select({ status: schema_1.walkthroughVersions.status })
                    .from(schema_1.walkthroughVersions)
                    .where((0, drizzle_orm_1.eq)(schema_1.walkthroughVersions.id, id))
                    .limit(1);
                currentStatus = version?.status;
            }
            if (currentStatus !== 'approved' && currentStatus !== 'published') {
                throw new Error('Este recorrido requiere ser aprobado por los revisores antes de publicarse');
            }
            data.status = 'published';
        }
        else {
            data.status = 'published';
        }
    }
    return context;
};
exports.validateApproval = validateApproval;
