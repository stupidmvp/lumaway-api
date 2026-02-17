"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkthroughParentCandidatesService = void 0;
const adapters_1 = require("../../adapters");
const walkthrough_parent_candidates_class_1 = require("./walkthrough-parent-candidates.class");
const walkthrough_parent_candidates_hooks_1 = require("./walkthrough-parent-candidates.hooks");
exports.walkthroughParentCandidatesService = new walkthrough_parent_candidates_class_1.WalkthroughParentCandidatesService(adapters_1.drizzleAdapter);
exports.walkthroughParentCandidatesService.hooks(walkthrough_parent_candidates_hooks_1.walkthroughParentCandidatesHooks);
