import { db } from '../../../adapters';
import { apiKeys, projects } from '../../../db/schema';
import { eq } from 'drizzle-orm';

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
export const findClientProjectConfig = async (context: any) => {
    const apiKey = context.params?.headers?.['x-api-key'] as string | undefined;

    if (!apiKey) {
        throw new Error('Missing API Key');
    }

    // Validate API Key and get projectId
    const keyRecords = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey)).limit(1);
    const keyRecord = keyRecords[0];

    if (!keyRecord) {
        throw new Error('Invalid API Key');
    }

    const projectId = keyRecord.projectId;

    // Fetch project details
    const [project] = await db.select({
        name: projects.name,
        logo: projects.logo,
        settings: projects.settings,
    })
        .from(projects)
        .where(eq(projects.id, projectId))
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
