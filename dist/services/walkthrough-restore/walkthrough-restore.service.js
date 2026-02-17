"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkthroughRestoreService = void 0;
const adapters_1 = require("../../adapters");
const walkthrough_restore_class_1 = require("./walkthrough-restore.class");
const walkthrough_restore_hooks_1 = require("./walkthrough-restore.hooks");
exports.walkthroughRestoreService = new walkthrough_restore_class_1.WalkthroughRestoreService(adapters_1.drizzleAdapter);
exports.walkthroughRestoreService.hooks((0, walkthrough_restore_hooks_1.createWalkthroughRestoreHooks)(exports.walkthroughRestoreService));
