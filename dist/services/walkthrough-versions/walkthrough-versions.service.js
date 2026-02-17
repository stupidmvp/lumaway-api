"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkthroughVersionsService = void 0;
const adapters_1 = require("../../adapters");
const walkthrough_versions_class_1 = require("./walkthrough-versions.class");
const walkthrough_versions_hooks_1 = require("./walkthrough-versions.hooks");
const schema_1 = require("../../db/schema");
const walkthrough_versions_schema_1 = require("./walkthrough-versions.schema");
exports.walkthroughVersionsService = new walkthrough_versions_class_1.WalkthroughVersionsService(adapters_1.drizzleAdapter, schema_1.walkthroughVersions, walkthrough_versions_schema_1.createVersionSchema, walkthrough_versions_schema_1.patchVersionSchema);
// Apply hooks
if (exports.walkthroughVersionsService.hooks) {
    exports.walkthroughVersionsService.hooks(walkthrough_versions_hooks_1.walkthroughVersionsHooks);
}
