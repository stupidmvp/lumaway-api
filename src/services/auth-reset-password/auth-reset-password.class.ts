import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `auth-reset-password` service — resets password using a token from the reset email.
 * Public endpoint, no authentication required.
 *
 * - create(data) → POST /auth-reset-password
 *
 * The actual logic lives in `hooks/resetPassword.ts`.
 */
export class AuthResetPasswordService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { return {}; }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
