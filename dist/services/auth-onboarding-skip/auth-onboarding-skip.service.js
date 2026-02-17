"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOnboardingSkipService = void 0;
const adapters_1 = require("../../adapters");
const auth_onboarding_skip_class_1 = require("./auth-onboarding-skip.class");
const auth_onboarding_skip_hooks_1 = require("./auth-onboarding-skip.hooks");
exports.authOnboardingSkipService = new auth_onboarding_skip_class_1.AuthOnboardingSkipService(adapters_1.drizzleAdapter);
exports.authOnboardingSkipService.hooks(auth_onboarding_skip_hooks_1.authOnboardingSkipHooks);
