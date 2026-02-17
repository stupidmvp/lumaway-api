import { db } from '../../../adapters';
import { users, commentAttachments, commentMentions, commentReactions, walkthroughs } from '../../../db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Populates the user object, attachments, mentions, and step info on comment results.
 */
export const populateCommentUser = async (context: any) => {
    const { result } = context;
    if (!result) return context;

    const items = Array.isArray(result) ? result : result.data || [result];

    // ── Batch-fetch walkthrough steps for step info resolution ──
    // Collect unique walkthroughIds (targetId) from comments that have a stepId
    const walkthroughIdSet = new Set<string>();
    for (const c of items) {
        if (c.stepId && c.targetId) walkthroughIdSet.add(c.targetId as string);
    }
    const walkthroughIds = Array.from(walkthroughIdSet);

    // Fetch walkthroughs with their steps JSON in one query
    const walkthroughStepsMap = new Map<string, any[]>();
    if (walkthroughIds.length > 0) {
        const wtRows = await db
            .select({ id: walkthroughs.id, title: walkthroughs.title, steps: walkthroughs.steps })
            .from(walkthroughs)
            .where(inArray(walkthroughs.id, walkthroughIds));

        for (const wt of wtRows) {
            walkthroughStepsMap.set(wt.id, {
                title: wt.title,
                steps: (wt.steps as any[]) || [],
            } as any);
        }
    }

    for (const item of items) {
        // Populate user
        if (item.userId) {
            const [user] = await db
                .select({
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email,
                    avatar: users.avatar,
                })
                .from(users)
                .where(eq(users.id, item.userId))
                .limit(1);

            if (user) {
                item.user = user;
            }
        }

        // Populate attachments
        if (item.id && !item.attachments) {
            const attachments = await db
                .select()
                .from(commentAttachments)
                .where(eq(commentAttachments.commentId, item.id));

            item.attachments = attachments;
        }

        // Populate mentions with user info
        if (item.id) {
            const mentions = await db
                .select({
                    id: commentMentions.id,
                    mentionedUserId: commentMentions.mentionedUserId,
                })
                .from(commentMentions)
                .where(eq(commentMentions.commentId, item.id));

            if (mentions.length > 0) {
                const mentionedUserIds = mentions.map(m => m.mentionedUserId);

                // Fetch all mentioned users
                const userMap = new Map<string, any>();
                for (const uid of mentionedUserIds) {
                    if (!userMap.has(uid)) {
                        const [u] = await db
                            .select({
                                id: users.id,
                                firstName: users.firstName,
                                lastName: users.lastName,
                                email: users.email,
                                avatar: users.avatar,
                            })
                            .from(users)
                            .where(eq(users.id, uid))
                            .limit(1);
                        if (u) userMap.set(uid, u);
                    }
                }

                item.mentions = mentions.map(m => ({
                    ...m,
                    user: userMap.get(m.mentionedUserId) || null,
                }));
            } else {
                item.mentions = [];
            }
        }

        // Populate reactions with user info
        if (item.id) {
            const reactions = await db
                .select({
                    id: commentReactions.id,
                    userId: commentReactions.userId,
                    emoji: commentReactions.emoji,
                    createdAt: commentReactions.createdAt,
                })
                .from(commentReactions)
                .where(eq(commentReactions.commentId, item.id));

            if (reactions.length > 0) {
                // Batch-fetch unique user info for reaction authors
                const reactionUserIds = [...new Set(reactions.map(r => r.userId))];
                const reactionUserMap = new Map<string, any>();
                for (const uid of reactionUserIds) {
                    // Reuse already-fetched user if it's the comment author
                    if (item.user && uid === item.userId) {
                        reactionUserMap.set(uid, item.user);
                    } else if (!reactionUserMap.has(uid)) {
                        const [u] = await db
                            .select({
                                id: users.id,
                                firstName: users.firstName,
                                lastName: users.lastName,
                                avatar: users.avatar,
                            })
                            .from(users)
                            .where(eq(users.id, uid))
                            .limit(1);
                        if (u) reactionUserMap.set(uid, u);
                    }
                }

                item.reactions = reactions.map(r => ({
                    ...r,
                    user: reactionUserMap.get(r.userId) || null,
                }));
            } else {
                item.reactions = [];
            }
        }

        // Populate step info from walkthrough steps JSON
        if (item.stepId && item.targetId) {
            const wtData = walkthroughStepsMap.get(item.targetId) as any;
            if (wtData) {
                const steps = wtData.steps as any[];
                const stepIndex = steps.findIndex((s: any) => s.id === item.stepId);
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
