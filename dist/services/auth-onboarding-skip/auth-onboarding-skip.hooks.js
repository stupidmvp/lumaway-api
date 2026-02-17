"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOnboardingSkipHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const skipOnboarding_1 = require("./hooks/skipOnboarding");
exports.authOnboardingSkipHooks = {
    before: {
        all: [authenticate_1.authenticate],
        create: [skipOnboarding_1.skipOnboarding],
    },
};
