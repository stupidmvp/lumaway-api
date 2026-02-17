"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateCommentUser = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Populates the user object, attachments, mentions, and step info on comment results.
 */
const populateCommentUser = async (context) => {
    const { result } = context;
    if (!result)
        return context;
    const items = Array.isArray(result) ? result : result.data || [result];
    // ── Batch-fetch walkthrough steps for step info resolution ──
    // Collect unique walkthroughIds (targetId) from comments that have a stepId
    const walkthroughIdSet = new Set();
    for (const c of items) {
        if (c.stepId && c.targetId)
            walkthroughIdSet.add(c.targetId);
    }
    const walkthroughIds = Array.from(walkthroughIdSet);
    // Fetch walkthroughs with their steps JSON in one query
    const walkthroughStepsMap = new Map();
    if (walkthroughIds.length > 0) {
        const wtRows = await adapters_1.db
            .select({ id: schema_1.walkthroughs.id, title: schema_1.walkthroughs.title, steps: schema_1.walkthroughs.steps })
            .from(schema_1.walkthroughs)
            .where((0, drizzle_orm_1.inArray)(schema_1.walkthroughs.id, walkthroughIds));
        for (const wt of wtRows) {
            walkthroughStepsMap.set(wt.id, {
                title: wt.title,
                steps: wt.steps || [],
            });
        }
    }
    for (const item of items) {
        // Populate user
        if (item.userId) {
            const [user] = await adapters_1.db
                .select({
                id: schema_1.users.id,
                firstName: schema_1.users.firstName,
                lastName: schema_1.users.lastName,
                email: schema_1.users.email,
                avatar: schema_1.users.avatar,
            })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, item.userId))
                .limit(1);
            if (user) {
                item.user = user;
            }
        }
        // Populate attachments
        if (item.id && !item.attachments) {
            const attachments = await adapters_1.db
                .select()
                .from(schema_1.commentAttachments)
                .where((0, drizzle_orm_1.eq)(schema_1.commentAttachments.commentId, item.id));
            item.attachments = attachments;
        }
        // Populate mentions with user info
        if (item.id) {
            const mentions = await adapters_1.db
                .select({
                id: schema_1.commentMentions.id,
                mentionedUserId: schema_1.commentMentions.mentionedUserId,
            })
                .from(schema_1.commentMentions)
                .where((0, drizzle_orm_1.eq)(schema_1.commentMentions.commentId, item.id));
            if (mentions.length > 0) {
                const mentionedUserIds = mentions.map(m => m.mentionedUserId);
                // Fetch all mentioned users
                const userMap = new Map();
                for (const uid of mentionedUserIds) {
                    if (!userMap.has(uid)) {
                        const [u] = await adapters_1.db
                            .select({
                            id: schema_1.users.id,
                            firstName: schema_1.users.firstName,
                            lastName: schema_1.users.lastName,
                            email: schema_1.users.email,
                            avatar: schema_1.users.avatar,
                        })
                            .from(schema_1.users)
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, uid))
                            .limit(1);
                        if (u)
                            userMap.set(uid, u);
                    }
                }
                item.mentions = mentions.map(m => ({
                    ...m,
                    user: userMap.get(m.mentionedUserId) || null,
                }));
            }
            else {
                item.mentions = [];
            }
        }
        // Populate step info from walkthrough steps JSON
        if (item.stepId && item.targetId) {
            const wtData = walkthroughStepsMap.get(item.targetId);
            if (wtData) {
                const steps = wtData.steps;
                const stepIndex = steps.findIndex((s) => s.id === item.stepId);
                if (stepIndex >= 0) {
                    item.stepInfo = {
                        title: steps[stepIndex].title || '',
                        index: stepIndex,
                        walkthroughTitle: wtData.title || '',
                    };
                }
            }
        }
        // For deleted comments, sanitize the content for display
        if (item.status === 'deleted') {
            item.content = '[This comment has been deleted]';
            item.originalContent = undefined;
        }
    }
    return context;
};
exports.populateCommentUser = populateCommentUser;
