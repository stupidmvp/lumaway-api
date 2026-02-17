import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `admin-permissions` service — list all permissions grouped by module.
 *
 * - find() → GET /admin-permissions
 *
 * The actual logic lives in `hooks/findPermissions.ts`.
 */
export class AdminPermissionsService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { return { data: [] }; }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
