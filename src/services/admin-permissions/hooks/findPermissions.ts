import { db } from '../../../adapters';
import { permissions, modules } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Before hook for `find` on `admin-permissions`.
 *
 * Lists all permissions grouped by module.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
export const findPermissions = async (context: any) => {
    const allPermissions = await db
        .select({
            id: permissions.id,
            name: permissions.name,
            description: permissions.description,
            moduleId: permissions.moduleId,
            moduleName: modules.name,
            moduleKey: modules.key,
        })
        .from(permissions)
        .innerJoin(modules, eq(permissions.moduleId, modules.id))
        .orderBy(modules.name, permissions.name);

    // Group by module
    const grouped: Record<string, { module: { id: string; name: string; key: string }; permissions: any[] }> = {};
    for (const p of allPermissions) {
        if (!grouped[p.moduleId]) {
            grouped[p.moduleId] = {
                module: { id: p.moduleId, name: p.moduleName, key: p.moduleKey },
                permissions: [],
            };
        }
        grouped[p.moduleId].permissions.push({
            id: p.id,
            name: p.name,
            description: p.description,
        });
    }

    context.result = { data: Object.values(grouped) };
    return context;
};

