"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOnboardingHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const completeOnboarding_1 = require("./hooks/completeOnboarding");
exports.authOnboardingHooks = {
    before: {
        all: [authenticate_1.authenticate],
        create: [completeOnboarding_1.completeOnboarding],
    },
};
