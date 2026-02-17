"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meService = void 0;
const adapters_1 = require("../../adapters");
const me_class_1 = require("./me.class");
const me_hooks_1 = require("./me.hooks");
exports.meService = new me_class_1.MeService(adapters_1.drizzleAdapter);
exports.meService.hooks(me_hooks_1.meHooks);
