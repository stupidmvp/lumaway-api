"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationRejectService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `invitation-reject` service — reject a project invitation (authenticated).
 *
 * - create(data, params) → POST /invitation-reject
 *
 * The actual logic lives in `hooks/rejectInvitation.ts`.
 */
class InvitationRejectService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { return {}; }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.InvitationRejectService = InvitationRejectService;
