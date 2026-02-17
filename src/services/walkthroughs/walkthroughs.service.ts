import { drizzleAdapter } from '../../adapters';
import { WalkthroughsService } from './walkthroughs.class';
import { walkthroughsHooks } from './walkthroughs.hooks';
import { walkthroughs } from '../../db/schema';
import { walkthroughsCreateSchema, walkthroughsPatchSchema } from './walkthroughs.schema';

export const walkthroughsService = new WalkthroughsService(
    drizzleAdapter,
    walkthroughs,
    walkthroughsCreateSchema,
    walkthroughsPatchSchema
);

// Apply hooks
if ((walkthroughsService as any).hooks) {
    (walkthroughsService as any).hooks(walkthroughsHooks);
}
