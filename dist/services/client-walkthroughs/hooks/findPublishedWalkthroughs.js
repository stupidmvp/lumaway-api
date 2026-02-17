"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPublishedWalkthroughs = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `find` on `client-walkthroughs`.
 *
 * Public API-key-authenticated endpoint for fetching published walkthroughs.
 * Requires `x-api-key` header.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
const findPublishedWalkthroughs = async (context) => {
    const apiKey = context.params?.headers?.['x-api-key'];
    if (!apiKey) {
        throw new Error('Missing API Key');
    }
    // Validate API Key and get projectId
    const keyRecords = await adapters_1.db.select().from(schema_1.apiKeys).where((0, drizzle_orm_1.eq)(schema_1.apiKeys.key, apiKey)).limit(1);
    const keyRecord = keyRecords[0];
    if (!keyRecord) {
        throw new Error('Invalid API Key');
    }
    // Fetch only published walkthroughs for this project
    const results = await adapters_1.db.select()
        .from(schema_1.walkthroughs)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.walkthroughs.projectId, keyRecord.projectId), (0, drizzle_orm_1.eq)(schema_1.walkthroughs.isPublished, true)));
    context.result = results;
    return context;
};
exports.findPublishedWalkthroughs = findPublishedWalkthroughs;
