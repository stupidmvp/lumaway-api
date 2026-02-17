"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationDetailsService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `invitation-details` service — get invitation details by token (public endpoint).
 *
 * - get(token) → GET /invitation-details/:token
 *
 * The actual logic lives in `hooks/getInvitationDetails.ts`.
 */
class InvitationDetailsService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { return {}; }
    async create(_data, _params) { throw new Error('Method not allowed'); }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.InvitationDetailsService = InvitationDetailsService;
