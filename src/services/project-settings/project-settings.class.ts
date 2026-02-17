import { BaseService, DrizzleAdapter, ServiceParams } from '@flex-donec/core';
import { projects, projectMembers } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserRoles } from '../../utils/roles';

/**
 * `project-settings` service — update project settings (deep-merge, owner/admin only).
 *
 * - patch(id, data) → PATCH /project-settings/:id
 */
export class ProjectSettingsService extends BaseService<any> {
    private adapter: DrizzleAdapter;

    constructor(storage: DrizzleAdapter) {
        super(storage);
        this.adapter = storage;
    }

    async patch(id: string, data: any, params?: ServiceParams): Promise<any> {
        const userId = params?.user?.id;
        if (!userId) {
            throw new Error('Authentication required');
        }

        const { settings } = data;

        if (!settings || typeof settings !== 'object') {
            throw new Error('Settings object is required');
        }

        // Validate settings shape
        const { projectSettingsSchema } = await import('../projects/projects.settings-schema');
        const parsed = projectSettingsSchema.safeParse(settings);
        if (!parsed.success) {
            throw new Error('Invalid settings');
        }

        const dbInstance = (this.adapter as any).db;

        // Check project exists
        const [project] = await dbInstance
            .select({ id: projects.id, organizationId: projects.organizationId, settings: projects.settings })
            .from(projects)
            .where(eq(projects.id, id))
            .limit(1);

        if (!project) {
            throw new Error('Project not found');
        }

        // Check permissions: must be owner of the project (or superadmin)
        const isSuperAdmin = (await getUserRoles(this.adapter, userId)).includes('superadmin');

        if (!isSuperAdmin) {
            const [membership] = await dbInstance
                .select({ role: projectMembers.role })
                .from(projectMembers)
                .where(
                    and(
                        eq(projectMembers.projectId, id),
                        eq(projectMembers.userId, userId)
                    )
                )
                .limit(1);

            if (!membership || membership.role !== 'owner') {
                throw new Error('Only project owners can update project settings');
            }
        }

        // Deep-merge settings
        const existingSettings = (project.settings as Record<string, any>) || {};
        const mergedSettings = { ...existingSettings, ...parsed.data };

        // Update project
        const [updated] = await dbInstance
            .update(projects)
            .set({ settings: mergedSettings, updatedAt: new Date() })
            .where(eq(projects.id, id))
            .returning();

        return updated;
    }

    // ── Not implemented methods ──
    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}

