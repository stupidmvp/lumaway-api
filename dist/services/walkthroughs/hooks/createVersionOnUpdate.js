"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVersionOnUpdate = exports.createVersionAfterUpdate = exports.captureStateBeforeUpdate = void 0;
/**
 * BEFORE hook: flags that a version should be created (only if title or steps changed).
 * Stores a flag in context.params so the after hook knows to proceed.
 */
const captureStateBeforeUpdate = () => {
    return async (context) => {
        const { data, method, params } = context;
        const walkthroughId = params?.route?.id;
        if (!walkthroughId) {
            return context;
        }
        // Only on patch/update
        if (method !== 'patch' && method !== 'update') {
            return context;
        }
        // Only flag for versioning if title or steps changed
        if (data.title || data.steps) {
            context.params._shouldCreateVersion = true;
        }
        return context;
    };
};
exports.captureStateBeforeUpdate = captureStateBeforeUpdate;
/**
 * AFTER hook: creates a version snapshot of the NEWLY SAVED state.
 * Only runs AFTER the patch/update succeeds, using context.result (the saved data).
 */
const createVersionAfterUpdate = () => {
    return async (context) => {
        const { app, method, params, result } = context;
        const walkthroughId = params?.route?.id;
        // Only proceed if the before hook flagged this for versioning
        if (!walkthroughId || !params?._shouldCreateVersion) {
            return context;
        }
        // Only create version on patch/update
        if (method !== 'patch' && method !== 'update') {
            return context;
        }
        // result is the updated walkthrough returned by the patch
        if (!result) {
            return context;
        }
        try {
            const versionsService = app.getService('walkthrough-versions');
            if (!versionsService) {
                return context;
            }
            // Get next version number
            const versions = await versionsService.find({
                walkthroughId: walkthroughId,
                $sort: { versionNumber: '-1' },
                $limit: 1
            });
            const versionsList = versions.data || versions;
            const lastVersion = Array.isArray(versionsList) && versionsList.length > 0
                ? versionsList[0]
                : null;
            const nextVersion = lastVersion ? lastVersion.versionNumber + 1 : 1;
            // Create version snapshot of the CURRENT (newly saved) state
            await versionsService.create({
                walkthroughId: walkthroughId,
                versionNumber: nextVersion,
                title: result.title,
                steps: result.steps || [],
                isPublished: result.isPublished ?? false,
                createdBy: params.user?.id
            }, { user: params.user });
        }
        catch (error) {
            console.error('Error creating walkthrough version:', error);
            // Don't fail the update response if version creation fails
        }
        // Clean up
        delete context.params._shouldCreateVersion;
        return context;
    };
};
exports.createVersionAfterUpdate = createVersionAfterUpdate;
/**
 * @deprecated Use captureStateBeforeUpdate() + createVersionAfterUpdate() instead.
 */
exports.createVersionOnUpdate = exports.captureStateBeforeUpdate;
