"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsService = void 0;
const adapters_1 = require("../../adapters");
const notifications_class_1 = require("./notifications.class");
const notifications_hooks_1 = require("./notifications.hooks");
const schema_1 = require("../../db/schema");
const notifications_schema_1 = require("./notifications.schema");
exports.notificationsService = new notifications_class_1.NotificationsService(adapters_1.drizzleAdapter, schema_1.notifications, notifications_schema_1.notificationsCreateSchema, notifications_schema_1.notificationsPatchSchema);
// Apply hooks
if (exports.notificationsService.hooks) {
    exports.notificationsService.hooks(notifications_hooks_1.notificationsHooks);
}
