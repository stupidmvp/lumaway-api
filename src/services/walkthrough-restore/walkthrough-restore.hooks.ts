import { authenticate } from '../../hooks/authenticate';
import { restoreWalkthrough } from './hooks/restoreWalkthrough';
import { injectApp } from './hooks/injectApp';

/**
 * Creates hooks for the walkthrough-restore service.
 * Needs the service instance to inject the app reference.
 */
export const createWalkthroughRestoreHooks = (service: any) => ({
    before: {
        all: [authenticate],
        create: [injectApp(service), restoreWalkthrough],
    },
});
