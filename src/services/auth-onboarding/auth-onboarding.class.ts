import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `auth-onboarding` service — creates org + optional first project and marks onboarding complete.
 *
 * - create(data) → POST /auth-onboarding
 *
 * The actual logic lives in `hooks/completeOnboarding.ts`.
 */
export class AuthOnboardingService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { return {}; }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
