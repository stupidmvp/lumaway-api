"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modulesService = void 0;
const adapters_1 = require("../../adapters");
const modules_class_1 = require("./modules.class");
exports.modulesService = new modules_class_1.ModulesService(adapters_1.drizzleAdapter);
