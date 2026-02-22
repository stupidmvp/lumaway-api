"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateApprovals = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * After hook to populate 'approvals' field for walkthrough versions.
 */
const populateApprovals = async (context) => {
    const { result, method } = context;
    if (!result)
        return context;
    const data = method === 'find' ? result.data : [result];
    const versionIds = data.map((v) => v.id).filter(Boolean);
    if (versionIds.length === 0)
        return context;
    // Fetch all approvals for these versions, joined with user info
    const approvals = await adapters_1.db
        .select({
        id: schema_1.walkthroughApprovals.id,
        versionId: schema_1.walkthroughApprovals.versionId,
        userId: schema_1.walkthroughApprovals.userId,
        createdAt: schema_1.walkthroughApprovals.createdAt,
        user: {
            id: schema_1.users.id,
            email: schema_1.users.email,
            firstName: schema_1.users.firstName,
            lastName: schema_1.users.lastName,
            avatar: schema_1.users.avatar
        }
    })
        .from(schema_1.walkthroughApprovals)
        .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.walkthroughApprovals.userId, schema_1.users.id))
        .where((0, drizzle_orm_1.inArray)(schema_1.walkthroughApprovals.versionId, versionIds));
    // Group approvals by versionId
    const approvalsMap = approvals.reduce((acc, approval) => {
        if (!acc[approval.versionId])
            acc[approval.versionId] = [];
        acc[approval.versionId].push(approval);
        return acc;
    }, {});
    // Attach to versions
    data.forEach((v) => {
        v.approvals = approvalsMap[v.id] || [];
    });
    return context;
};
exports.populateApprovals = populateApprovals;
