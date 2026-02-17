"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPermissions = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `find` on `admin-permissions`.
 *
 * Lists all permissions grouped by module.
 *
 * Sets `context.result` to short-circuit the default service find.
 */
const findPermissions = async (context) => {
    const allPermissions = await adapters_1.db
        .select({
        id: schema_1.permissions.id,
        name: schema_1.permissions.name,
        description: schema_1.permissions.description,
        moduleId: schema_1.permissions.moduleId,
        moduleName: schema_1.modules.name,
        moduleKey: schema_1.modules.key,
    })
        .from(schema_1.permissions)
        .innerJoin(schema_1.modules, (0, drizzle_orm_1.eq)(schema_1.permissions.moduleId, schema_1.modules.id))
        .orderBy(schema_1.modules.name, schema_1.permissions.name);
    // Group by module
    const grouped = {};
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
exports.findPermissions = findPermissions;
