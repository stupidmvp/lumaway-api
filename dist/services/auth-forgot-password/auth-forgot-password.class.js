"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthForgotPasswordService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `auth-forgot-password` service — sends a password reset email.
 * Public endpoint, no authentication required.
 *
 * - create(data) → POST /auth-forgot-password
 *
 * The actual logic lives in `hooks/sendResetEmail.ts`.
 */
class AuthForgotPasswordService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { return {}; }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.AuthForgotPasswordService = AuthForgotPasswordService;
