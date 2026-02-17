import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `auth-onboarding-skip` service — marks onboarding as completed without creating an org.
 *
 * - create(data) → POST /auth-onboarding-skip
 *
 * The actual logic lives in `hooks/skipOnboarding.ts`.
 */
export class AuthOnboardingSkipService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { return {}; }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
