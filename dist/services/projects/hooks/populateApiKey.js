"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateApiKey = void 0;
const api_keys_service_1 = require("../../api-keys/api-keys.service");
/**
 * Populates the apiKey field for project(s)
 */
const populateApiKey = async (context) => {
    const { method, result, params } = context;
    if (!result)
        return context;
    const populateForProject = async (project) => {
        if (!project.id)
            return;
        try {
            // Note: DrizzleService.find() expects query fields at the TOP level,
            // not nested under 'query'. Do NOT spread full params (it overwrites filters).
            const keys = await api_keys_service_1.apiKeysService.find({
                projectId: project.id,
                $limit: 1
            });
            const keyData = Array.isArray(keys) ? keys[0] : (keys.data ? keys.data[0] : null);
            if (keyData) {
                project.apiKey = keyData.key;
            }
        }
        catch (error) {
            console.error(`Error populating API key for project ${project.id}:`, error);
        }
    };
    if (method === 'find' && (Array.isArray(result) || result.data)) {
        const projects = Array.isArray(result) ? result : result.data;
        await Promise.all(projects.map(populateForProject));
    }
    else {
        await populateForProject(result);
    }
    return context;
};
exports.populateApiKey = populateApiKey;
