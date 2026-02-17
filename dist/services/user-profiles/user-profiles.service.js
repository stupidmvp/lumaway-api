"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userProfilesService = void 0;
const adapters_1 = require("../../adapters");
const user_profiles_class_1 = require("./user-profiles.class");
const user_profiles_hooks_1 = require("./user-profiles.hooks");
exports.userProfilesService = new user_profiles_class_1.UserProfilesService(adapters_1.drizzleAdapter);
exports.userProfilesService.hooks(user_profiles_hooks_1.userProfilesHooks);
