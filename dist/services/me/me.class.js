"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `me` service — manages the current authenticated user's profile.
 *
 * - find()      → GET /me        → returns current user profile with memberships
 * - patch(id)   → PATCH /me/:id  → updates user profile (id is ignored, uses auth user)
 *
 * The actual logic lives in `hooks/findCurrentUser.ts` and `hooks/patchCurrentUser.ts`.
 */
class MeService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) {
        return { data: [], total: 0 };
    }
    async get(_id, _params) {
        return this.find(_params);
    }
    async create(_data, _params) {
        throw new Error('Method not allowed on me service');
    }
    async patch(_id, _data, _params) {
        return {};
    }
    async remove(_id, _params) {
        throw new Error('Method not allowed on me service');
    }
}
exports.MeService = MeService;
