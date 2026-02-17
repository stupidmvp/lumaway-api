import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `auth-change-password` service — change password for authenticated user.
 *
 * - create(data) → POST /auth-change-password
 *
 * The actual logic lives in `hooks/changePassword.ts`.
 */
export class AuthChangePasswordService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { return {}; }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
