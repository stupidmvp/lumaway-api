"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkthroughsService = void 0;
const adapters_1 = require("../../adapters");
const walkthroughs_class_1 = require("./walkthroughs.class");
const walkthroughs_hooks_1 = require("./walkthroughs.hooks");
const schema_1 = require("../../db/schema");
const walkthroughs_schema_1 = require("./walkthroughs.schema");
exports.walkthroughsService = new walkthroughs_class_1.WalkthroughsService(adapters_1.drizzleAdapter, schema_1.walkthroughs, walkthroughs_schema_1.walkthroughsCreateSchema, walkthroughs_schema_1.walkthroughsPatchSchema);
// Apply hooks
if (exports.walkthroughsService.hooks) {
    exports.walkthroughsService.hooks(walkthroughs_hooks_1.walkthroughsHooks);
}
