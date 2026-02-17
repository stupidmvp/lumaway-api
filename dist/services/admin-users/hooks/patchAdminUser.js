"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchAdminUser = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `patch` on `admin-users`.
 *
 * Updates a user's status, name, etc.
 *
 * Sets `context.result` to short-circuit the default service patch.
 */
const patchAdminUser = async (context) => {
    const id = context.id || context.params?.route?.id;
    const { status: newStatus, firstName, lastName } = context.data;
    const updateData = { updatedAt: new Date() };
    if (newStatus !== undefined)
        updateData.status = newStatus;
    if (firstName !== undefined)
        updateData.firstName = firstName;
    if (lastName !== undefined)
        updateData.lastName = lastName;
    const [updated] = await adapters_1.db
        .update(schema_1.users)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
        .returning();
    if (!updated) {
        throw new Error('User not found');
    }
    const { password: _, ...safeUser } = updated;
    context.result = safeUser;
    return context;
};
exports.patchAdminUser = patchAdminUser;
