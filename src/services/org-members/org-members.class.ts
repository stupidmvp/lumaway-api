import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `org-members` service — manages organization members.
 *
 * - find(params)       → GET /org-members?orgId=xxx   → list members of an org
 * - patch(memberId)    → PATCH /org-members/:id       → update member role
 * - remove(memberId)   → DELETE /org-members/:id      → remove member
 *
 * The actual logic lives in `hooks/findOrgMembers.ts`, `hooks/patchOrgMember.ts`, `hooks/removeOrgMember.ts`.
 */
export class OrgMembersService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> {
        return { data: [], total: 0 };
    }

    async get(_id: string, _params?: any): Promise<any> {
        throw new Error('Method not allowed on org-members service');
    }

    async create(_data: any, _params?: any): Promise<any> {
        throw new Error('Method not allowed on org-members service');
    }

    async patch(_id: string, _data: any, _params?: any): Promise<any> {
        return {};
    }

    async remove(_id: string, _params?: any): Promise<any> {
        return {};
    }
}
