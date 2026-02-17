"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgMembersService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `org-members` service — manages organization members.
 *
 * - find(params)       → GET /org-members?orgId=xxx   → list members of an org
 * - patch(memberId)    → PATCH /org-members/:id       → update member role
 * - remove(memberId)   → DELETE /org-members/:id      → remove member
 *
 * The actual logic lives in `hooks/findOrgMembers.ts`, `hooks/patchOrgMember.ts`, `hooks/removeOrgMember.ts`.
 */
class OrgMembersService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) {
        return { data: [], total: 0 };
    }
    async get(_id, _params) {
        throw new Error('Method not allowed on org-members service');
    }
    async create(_data, _params) {
        throw new Error('Method not allowed on org-members service');
    }
    async patch(_id, _data, _params) {
        return {};
    }
    async remove(_id, _params) {
        return {};
    }
}
exports.OrgMembersService = OrgMembersService;
