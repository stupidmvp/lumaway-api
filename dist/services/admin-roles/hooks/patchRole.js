"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchRole = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `patch` on `admin-roles`.
 *
 * Updates a role's name/description.
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
const patchRole = async (context) => {
    const id = context.id || context.params?.route?.id;
    const { name, description } = context.data;
    const updateData = { updatedAt: new Date() };
    if (name !== undefined)
        updateData.name = name;
    if (description !== undefined)
        updateData.description = description;
    const [updated] = await adapters_1.db
        .update(schema_1.roles)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(schema_1.roles.id, id))
        .returning();
    if (!updated) {
        throw new Error('Role not found');
    }
    context.result = updated;
    return context;
};
exports.patchRole = patchRole;
