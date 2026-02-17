import { HookContext } from '@flex-donec/core';
import { apiKeysService } from '../../api-keys/api-keys.service';

/**
 * Populates the apiKey field for project(s)
 */
export const populateApiKey = async (context: HookContext) => {
    const { method, result, params } = context;

    if (!result) return context;

    const populateForProject = async (project: any) => {
        if (!project.id) return;

        try {
            // Note: DrizzleService.find() expects query fields at the TOP level,
            // not nested under 'query'. Do NOT spread full params (it overwrites filters).
            const keys = await apiKeysService.find({
                projectId: project.id,
                $limit: 1
            }) as any;

            const keyData = Array.isArray(keys) ? keys[0] : (keys.data ? keys.data[0] : null);
            if (keyData) {
                project.apiKey = keyData.key;
            }
        } catch (error) {
            console.error(`Error populating API key for project ${project.id}:`, error);
        }
    };

    if (method === 'find' && (Array.isArray(result) || result.data)) {
        const projects = Array.isArray(result) ? result : result.data;
        await Promise.all(projects.map(populateForProject));
    } else {
        await populateForProject(result);
    }

    return context;
};
