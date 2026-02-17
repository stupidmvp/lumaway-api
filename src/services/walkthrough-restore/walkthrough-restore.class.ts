import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `walkthrough-restore` service — restore a walkthrough to a previous version.
 *
 * - create(data, params) → POST /walkthrough-restore
 *   `data.walkthroughId` is the walkthrough ID; `data.versionId` is the version to restore.
 *
 * The actual logic lives in `hooks/restoreWalkthrough.ts`.
 *
 * Note: The app reference is injected via `setApp()` and passed through hooks
 * via `params._app` so the hook can access other services.
 */
export class WalkthroughRestoreService extends BaseService<any> {
    private appRef: any;

    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    /**
     * Inject the FlexApp reference so hooks can use getService().
     */
    setApp(app: any) {
        this.appRef = app;
    }

    /**
     * Returns the app reference (used by the injectApp hook).
     */
    getApp() {
        return this.appRef;
    }

    async find(_params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { return {}; }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}
