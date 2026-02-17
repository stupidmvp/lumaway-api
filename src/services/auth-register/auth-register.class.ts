import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `auth-register` service — registers a new user.
 *
 * - create(data) → POST /auth-register → creates a user account
 *
 * The actual logic lives in `hooks/registerUser.ts`.
 */
export class AuthRegisterService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { return {}; }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
