"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthOnboardingService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `auth-onboarding` service — creates org + optional first project and marks onboarding complete.
 *
 * - create(data) → POST /auth-onboarding
 *
 * The actual logic lives in `hooks/completeOnboarding.ts`.
 */
class AuthOnboardingService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { return {}; }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.AuthOnboardingService = AuthOnboardingService;
