"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectSettingsService = void 0;
const adapters_1 = require("../../adapters");
const project_settings_class_1 = require("./project-settings.class");
const project_settings_hooks_1 = require("./project-settings.hooks");
exports.projectSettingsService = new project_settings_class_1.ProjectSettingsService(adapters_1.drizzleAdapter);
exports.projectSettingsService.hooks(project_settings_hooks_1.projectSettingsHooks);
