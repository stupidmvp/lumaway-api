"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthChangePasswordService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `auth-change-password` service — change password for authenticated user.
 *
 * - create(data) → POST /auth-change-password
 *
 * The actual logic lives in `hooks/changePassword.ts`.
 */
class AuthChangePasswordService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { return {}; }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.AuthChangePasswordService = AuthChangePasswordService;
