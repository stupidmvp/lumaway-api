"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRegisterService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `auth-register` service — registers a new user.
 *
 * - create(data) → POST /auth-register → creates a user account
 *
 * The actual logic lives in `hooks/registerUser.ts`.
 */
class AuthRegisterService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { return {}; }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.AuthRegisterService = AuthRegisterService;
