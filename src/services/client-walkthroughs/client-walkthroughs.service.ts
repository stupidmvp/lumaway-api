import { drizzleAdapter } from '../../adapters';
import { ClientWalkthroughsService } from './client-walkthroughs.class';
import { clientWalkthroughsHooks } from './client-walkthroughs.hooks';

export const clientWalkthroughsService = new ClientWalkthroughsService(drizzleAdapter);
(clientWalkthroughsService as any).hooks(clientWalkthroughsHooks);

