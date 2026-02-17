import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `user-organization-leave` service — allows a user to leave an organization.
 *
 * - create({ organizationId }) → POST /user-organization-leave → leave an org
 *
 * The actual logic lives in `hooks/leaveOrganization.ts`.
 */
export class UserOrganizationLeaveService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> {
        throw new Error('Method not allowed on user-organization-leave service');
    }

    async get(_id: string, _params?: any): Promise<any> {
        throw new Error('Method not allowed on user-organization-leave service');
    }

    async create(_data: any, _params?: any): Promise<any> {
        return {};
    }

    async patch(_id: string, _data: any, _params?: any): Promise<any> {
        throw new Error('Method not allowed on user-organization-leave service');
    }

    async remove(_id: string, _params?: any): Promise<any> {
        throw new Error('Method not allowed on user-organization-leave service');
    }
}
