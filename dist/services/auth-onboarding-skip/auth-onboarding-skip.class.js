"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthOnboardingSkipService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `auth-onboarding-skip` service — marks onboarding as completed without creating an org.
 *
 * - create(data) → POST /auth-onboarding-skip
 *
 * The actual logic lives in `hooks/skipOnboarding.ts`.
 */
class AuthOnboardingSkipService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { return {}; }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.AuthOnboardingSkipService = AuthOnboardingSkipService;
