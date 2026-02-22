"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchWalkthroughTrigger = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `patch` on `client-walkthroughs`.
 *
 * Allows updating specific configuration fields via API Key.
 * Fields allowed: trigger, executionMode, repeatable.
 */
const patchWalkthroughTrigger = async (context) => {
    const apiKey = context.params?.headers?.['x-api-key'];
    if (!apiKey) {
        throw new Error('Missing API Key');
    }
    const { id, data } = context;
    if (!id) {
        throw new Error('Missing walkthrough ID');
    }
    // Validate API Key and get projectId
    const keyRecords = await adapters_1.db.select().from(schema_1.apiKeys).where((0, drizzle_orm_1.eq)(schema_1.apiKeys.key, apiKey)).limit(1);
    const keyRecord = keyRecords[0];
    if (!keyRecord) {
        throw new Error('Invalid API Key');
    }
    const projectId = keyRecord.projectId;
    // Verify walkthrough exists and belongs to this project
    const walkthroughRecords = await adapters_1.db.select()
        .from(schema_1.walkthroughs)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.walkthroughs.id, id), (0, drizzle_orm_1.eq)(schema_1.walkthroughs.projectId, projectId)))
        .limit(1);
    const walkthrough = walkthroughRecords[0];
    if (!walkthrough) {
        throw new Error('Walkthrough not found or access denied');
    }
    // Allowed fields for patching via client API
    const patchData = {};
    if (data.trigger !== undefined)
        patchData.trigger = data.trigger;
    if (data.executionMode !== undefined)
        patchData.executionMode = data.executionMode;
    if (data.repeatable !== undefined)
        patchData.repeatable = data.repeatable;
    if (Object.keys(patchData).length === 0) {
        throw new Error('No valid fields provided for update');
    }
    // Perform update
    const [updated] = await adapters_1.db.update(schema_1.walkthroughs)
        .set(patchData)
        .where((0, drizzle_orm_1.eq)(schema_1.walkthroughs.id, id))
        .returning();
    context.result = updated;
    return context;
};
exports.patchWalkthroughTrigger = patchWalkthroughTrigger;
