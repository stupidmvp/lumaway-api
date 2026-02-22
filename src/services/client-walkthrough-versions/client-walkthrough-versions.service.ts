import { drizzleAdapter } from '../../adapters';
import { ClientWalkthroughVersionsService } from './client-walkthrough-versions.class';
import { clientWalkthroughVersionsHooks } from './client-walkthrough-versions.hooks';

export const clientWalkthroughVersionsService = new ClientWalkthroughVersionsService(drizzleAdapter);
(clientWalkthroughVersionsService as any).hooks(clientWalkthroughVersionsHooks);
