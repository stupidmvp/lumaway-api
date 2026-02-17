"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCreatorAsMember = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
/**
 * After a project is created, automatically add the creator as an 'owner' member.
 * Runs as an after:create hook on the projects service.
 */
const addCreatorAsMember = async (context) => {
    const { result, params } = context;
    const user = params?.user;
    if (!result || !user)
        return context;
    const projectId = result.id;
    try {
        await adapters_1.db.insert(schema_1.projectMembers).values({
            projectId,
            userId: user.id,
            role: 'owner',
        });
    }
    catch (error) {
        console.error('Error adding creator as project member:', error);
        // Non-blocking: project is already created, membership is best-effort
    }
    return context;
};
exports.addCreatorAsMember = addCreatorAsMember;
