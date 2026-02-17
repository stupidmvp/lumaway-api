"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRole = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
/**
 * Before hook for `create` on `admin-roles`.
 *
 * Creates a new global role.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
const createRole = async (context) => {
    const { name, description } = context.data;
    if (!name) {
        throw new Error('Role name is required');
    }
    try {
        const [created] = await adapters_1.db.insert(schema_1.roles).values({ name, description }).returning();
        context.result = created;
    }
    catch (err) {
        if (err.code === '23505') {
            throw new Error('A role with this name already exists');
        }
        throw err;
    }
    return context;
};
exports.createRole = createRole;
