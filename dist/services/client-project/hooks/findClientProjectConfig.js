"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findClientProjectConfig = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `find` on `client-project`.
 *
 * Public API-key-authenticated endpoint for fetching project configuration.
 * Requires `x-api-key` header.
 *
 * Returns:
 * - name
 * - logo
 * - settings (assistantName, assistantWelcomeMessage, branding, etc.)
 */
const findClientProjectConfig = async (context) => {
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
    const projectId = keyRecord.projectId;
    // Fetch project details
    const [project] = await adapters_1.db.select({
        name: schema_1.projects.name,
        logo: schema_1.projects.logo,
        settings: schema_1.projects.settings,
    })
        .from(schema_1.projects)
        .where((0, drizzle_orm_1.eq)(schema_1.projects.id, projectId))
        .limit(1);
    if (!project) {
        throw new Error('Project not found');
    }
    // Return only the necessary public config
    context.result = {
        name: project.name,
        logo: project.logo,
        settings: project.settings || {},
    };
    return context;
};
exports.findClientProjectConfig = findClientProjectConfig;
