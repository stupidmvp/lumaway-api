"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientProjectService = void 0;
const adapters_1 = require("../../adapters");
const client_project_class_1 = require("./client-project.class");
const client_project_hooks_1 = require("./client-project.hooks");
exports.clientProjectService = new client_project_class_1.ClientProjectService(adapters_1.drizzleAdapter);
exports.clientProjectService.hooks(client_project_hooks_1.clientProjectHooks);
