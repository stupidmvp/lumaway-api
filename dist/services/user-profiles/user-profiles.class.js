"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfilesService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `user-profiles` service — get a user's public profile by ID.
 *
 * - get(id) → GET /user-profiles/:id
 *
 * Returns basic public-facing info (name, avatar, email, org, role).
 * Requires authentication. The actual logic lives in `hooks/getUserProfile.ts`.
 */
class UserProfilesService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { return {}; }
    async create(_data, _params) { throw new Error('Method not allowed'); }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.UserProfilesService = UserProfilesService;
