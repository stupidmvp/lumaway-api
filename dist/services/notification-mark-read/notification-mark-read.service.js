"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationMarkReadService = void 0;
const adapters_1 = require("../../adapters");
const notification_mark_read_class_1 = require("./notification-mark-read.class");
const notification_mark_read_hooks_1 = require("./notification-mark-read.hooks");
exports.notificationMarkReadService = new notification_mark_read_class_1.NotificationMarkReadService(adapters_1.drizzleAdapter);
exports.notificationMarkReadService.hooks(notification_mark_read_hooks_1.notificationMarkReadHooks);
