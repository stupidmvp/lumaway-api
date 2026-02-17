"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOnboardingService = void 0;
const adapters_1 = require("../../adapters");
const auth_onboarding_class_1 = require("./auth-onboarding.class");
const auth_onboarding_hooks_1 = require("./auth-onboarding.hooks");
exports.authOnboardingService = new auth_onboarding_class_1.AuthOnboardingService(adapters_1.drizzleAdapter);
exports.authOnboardingService.hooks(auth_onboarding_hooks_1.authOnboardingHooks);
