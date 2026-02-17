"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkthroughActorsService = void 0;
const adapters_1 = require("../../adapters");
const walkthrough_actors_class_1 = require("./walkthrough-actors.class");
const walkthrough_actors_hooks_1 = require("./walkthrough-actors.hooks");
exports.walkthroughActorsService = new walkthrough_actors_class_1.WalkthroughActorsService(adapters_1.drizzleAdapter);
// Apply hooks
if (exports.walkthroughActorsService.hooks) {
    exports.walkthroughActorsService.hooks(walkthrough_actors_hooks_1.walkthroughActorsHooks);
}
