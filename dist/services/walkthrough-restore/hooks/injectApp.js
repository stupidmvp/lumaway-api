"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectApp = void 0;
/**
 * Before hook that injects the FlexApp reference into `context.params._app`.
 *
 * This allows subsequent hooks (like `restoreWalkthrough`) to access
 * other services via `app.getService()`.
 */
const injectApp = (service) => async (context) => {
    context.params = context.params || {};
    context.params._app = service.getApp();
    return context;
};
exports.injectApp = injectApp;
