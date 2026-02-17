import { drizzleAdapter, db } from '../../../adapters';
import { walkthroughs, projectMembers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserRoles } from '../../../utils/roles';

/**
 * Before hook for `create` on `walkthrough-restore`.
 *
 * Restores a walkthrough to a previous version.
 * `data.walkthroughId` is the walkthrough ID; `data.versionId` is the version to restore.
 *
 * Requires `context.params._app` to be set for service access.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
export const restoreWalkthrough = async (context: any) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }

    const walkthroughId = context.data?.walkthroughId;
    const { versionId } = context.data;

    if (!walkthroughId) {
        throw new Error('Walkthrough ID is required');
    }

    if (!versionId) {
        throw new Error('versionId is required');
    }

    // Get services using app reference stored in params
    const app = context.params?._app;
    const versionsService = app?.getService('walkthrough-versions');
    const walkthroughsService = app?.getService('walkthroughs');

    if (!versionsService || !walkthroughsService) {
        throw new Error('Services not available');
    }

    // Fetch the walkthrough to get projectId
    const [wt] = await db
        .select({ projectId: walkthroughs.projectId })
        .from(walkthroughs)
        .where(eq(walkthroughs.id, walkthroughId))
        .limit(1);

    if (!wt) {
        throw new Error('Walkthrough not found');
    }

    // Superadmin bypasses project membership check
    const isSuperAdmin = (await getUserRoles(drizzleAdapter, userId)).includes('superadmin');

    if (!isSuperAdmin) {
        // Check project membership (editor+ required to restore)
        const [membership] = await db
            .select()
            .from(projectMembers)
            .where(
                and(
                    eq(projectMembers.projectId, wt.projectId),
                    eq(projectMembers.userId, userId)
                )
            )
            .limit(1);

        if (!membership || !['owner', 'editor'].includes(membership.role)) {
            throw new Error('Insufficient permissions to restore versions');
        }
    }

    // Fetch the version to restore
    const version = await versionsService.get(versionId);

    if (version.walkthroughId !== walkthroughId) {
        throw new Error('Version does not belong to this walkthrough');
    }

    // Update the walkthrough with version data (internal call, bypasses route hooks)
    const restored = await walkthroughsService.patch(walkthroughId, {
        title: version.title,
        steps: version.steps,
        isPublished: version.isPublished,
    });

    // Create a new version entry for the restored state
    // (the patch above bypasses route hooks, so createVersionAfterUpdate doesn't run)
    const latestVersions = await versionsService.find({
        walkthroughId,
        $sort: { versionNumber: '-1' },
        $limit: 1,
    });

    const versionsList = Array.isArray(latestVersions) ? latestVersions : latestVersions.data || [];
    const lastVersion = versionsList.length > 0 ? versionsList[0] : null;
    const nextVersion = lastVersion ? lastVersion.versionNumber + 1 : 1;

    // Create version snapshot of the restored state, marking where it was restored from
    await versionsService.create({
        walkthroughId,
        versionNumber: nextVersion,
        title: restored.title,
        steps: restored.steps || [],
        isPublished: restored.isPublished ?? false,
        createdBy: userId,
        restoredFrom: versionId,
    }, { user: context.params.user });

    context.result = restored;
    return context;
};

