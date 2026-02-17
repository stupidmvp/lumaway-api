import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `auth-forgot-password` service — sends a password reset email.
 * Public endpoint, no authentication required.
 *
 * - create(data) → POST /auth-forgot-password
 *
 * The actual logic lives in `hooks/sendResetEmail.ts`.
 */
export class AuthForgotPasswordService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { return {}; }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
