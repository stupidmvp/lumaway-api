"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findClientWalkthroughVersions = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `find` on `client-walkthrough-versions`.
 * Validates API Key and returns versions for the specified walkthrough,
 * scoped to the key's project.
 */
const findClientWalkthroughVersions = async (context) => {
    const apiKey = context.params?.headers?.['x-api-key'];
    const walkthroughId = context.params?.query?.walkthroughId;
    if (!apiKey) {
        throw new Error('Missing API Key');
    }
    if (!walkthroughId) {
        throw new Error('Missing walkthroughId query parameter');
    }
    // 1. Validate API Key and get projectId
    const [keyRecord] = await adapters_1.db.select().from(schema_1.apiKeys).where((0, drizzle_orm_1.eq)(schema_1.apiKeys.key, apiKey)).limit(1);
    if (!keyRecord) {
        throw new Error('Invalid API Key');
    }
    const projectId = keyRecord.projectId;
    // 2. Verify walkthrough belongs to this project
    const [walkthrough] = await adapters_1.db.select()
        .from(schema_1.walkthroughs)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.walkthroughs.id, walkthroughId), (0, drizzle_orm_1.eq)(schema_1.walkthroughs.projectId, projectId)))
        .limit(1);
    if (!walkthrough) {
        throw new Error('Walkthrough not found or access denied');
    }
    // 3. Fetch published versions for this walkthrough
    const versions = await adapters_1.db.select()
        .from(schema_1.walkthroughVersions)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.walkthroughVersions.walkthroughId, walkthroughId), (0, drizzle_orm_1.eq)(schema_1.walkthroughVersions.isPublished, true)));
    context.result = versions;
    return context;
};
exports.findClientWalkthroughVersions = findClientWalkthroughVersions;
