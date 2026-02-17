"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllRead = void 0;
const adapters_1 = require("../../../adapters");
const schema_1 = require("../../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Before hook for `create` on `notification-mark-read`.
 *
 * Marks all notifications as read for the authenticated user.
 *
 * Sets `context.result` to short-circuit the default service create.
 */
const markAllRead = async (context) => {
    const userId = context.params?.user?.id;
    if (!userId) {
        throw new Error('Authentication required');
    }
    await adapters_1.db.update(schema_1.notifications)
        .set({ read: true })
        .where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId));
    context.result = { message: 'All notifications marked as read' };
    return context;
};
exports.markAllRead = markAllRead;
