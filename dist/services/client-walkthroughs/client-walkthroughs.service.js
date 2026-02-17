"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientWalkthroughsService = void 0;
const adapters_1 = require("../../adapters");
const client_walkthroughs_class_1 = require("./client-walkthroughs.class");
const client_walkthroughs_hooks_1 = require("./client-walkthroughs.hooks");
exports.clientWalkthroughsService = new client_walkthroughs_class_1.ClientWalkthroughsService(adapters_1.drizzleAdapter);
exports.clientWalkthroughsService.hooks(client_walkthroughs_hooks_1.clientWalkthroughsHooks);
