/**
 * Before hook that injects the FlexApp reference into `context.params._app`.
 *
 * This allows subsequent hooks (like `restoreWalkthrough`) to access
 * other services via `app.getService()`.
 */
export const injectApp = (service: any) => async (context: any) => {
    context.params = context.params || {};
    context.params._app = service.getApp();
    return context;
};

