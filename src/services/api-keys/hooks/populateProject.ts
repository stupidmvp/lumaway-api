import { HookContext } from '@flex-donec/core';
import { db } from '../../../adapters/index.js';
import { projects } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const populateProject = async (context: HookContext) => {
    const { result } = context;

    if (!result) return context;

    // Handle both single result and arrays
    const items = Array.isArray(result) ? result : result.data || [result];

    for (const item of items) {
        // Populate project
        if (item.projectId) {
            const [project] = await db
                .select({
                    id: projects.id,
                    name: projects.name,
                    organizationId: projects.organizationId
                })
                .from(projects)
                .where(eq(projects.id, item.projectId));

            if (project) {
                item.project = project;
            }
        }
    }

    return context;
};
