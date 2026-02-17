import { drizzleAdapter } from '../../adapters';
import { WalkthroughActorsService } from './walkthrough-actors.class';
import { walkthroughActorsHooks } from './walkthrough-actors.hooks';

export const walkthroughActorsService = new WalkthroughActorsService(drizzleAdapter);

// Apply hooks
if ((walkthroughActorsService as any).hooks) {
    (walkthroughActorsService as any).hooks(walkthroughActorsHooks);
}

