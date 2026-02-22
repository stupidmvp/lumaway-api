"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncPublishedVersion = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * After hook for walkthrough-versions.
 *
 * When a version's status becomes 'published', its title and steps
 * are synchronized to the main 'walkthroughs' table. This ensures
 * that the live content (what the SDK sees) strictly matches the
 * approved and published version.
 */
const syncPublishedVersion = async (context) => {
    const { result, method } = context;
    // We only care if the version just became published
    if (result && result.status === 'published' && result.walkthroughId) {
        // Only sync if it was a create or if status was explicitly patched to 'published'
        // (In case of patch, we check if result actually has 'published' status)
        await adapters_1.db.update(schema_1.walkthroughs)
            .set({
            title: result.title,
            steps: result.steps,
            isPublished: true,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.walkthroughs.id, result.walkthroughId));
    }
    return context;
};
exports.syncPublishedVersion = syncPublishedVersion;
