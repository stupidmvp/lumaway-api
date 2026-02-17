"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalkthroughRestoreService = void 0;
const core_1 = require("@flex-donec/core");
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
class WalkthroughRestoreService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    /**
     * Inject the FlexApp reference so hooks can use getService().
     */
    setApp(app) {
        this.appRef = app;
    }
    /**
     * Returns the app reference (used by the injectApp hook).
     */
    getApp() {
        return this.appRef;
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { return {}; }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.WalkthroughRestoreService = WalkthroughRestoreService;
