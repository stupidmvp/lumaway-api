import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `notification-mark-read` service — mark all notifications as read for authenticated user.
 *
 * - create(data) → POST /notification-mark-read
 *
 * The actual logic lives in `hooks/markAllRead.ts`.
 */
export class NotificationMarkReadService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { return {}; }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
