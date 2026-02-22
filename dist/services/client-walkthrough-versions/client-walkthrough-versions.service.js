"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientWalkthroughVersionsService = void 0;
const adapters_1 = require("../../adapters");
const client_walkthrough_versions_class_1 = require("./client-walkthrough-versions.class");
const client_walkthrough_versions_hooks_1 = require("./client-walkthrough-versions.hooks");
exports.clientWalkthroughVersionsService = new client_walkthrough_versions_class_1.ClientWalkthroughVersionsService(adapters_1.drizzleAdapter);
exports.clientWalkthroughVersionsService.hooks(client_walkthrough_versions_hooks_1.clientWalkthroughVersionsHooks);
