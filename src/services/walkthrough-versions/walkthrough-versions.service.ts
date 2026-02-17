import { drizzleAdapter } from '../../adapters';
import { WalkthroughVersionsService } from './walkthrough-versions.class';
import { walkthroughVersionsHooks } from './walkthrough-versions.hooks';
import { walkthroughVersions } from '../../db/schema';
import { createVersionSchema, patchVersionSchema } from './walkthrough-versions.schema';

export const walkthroughVersionsService = new WalkthroughVersionsService(
    drizzleAdapter,
    walkthroughVersions,
    createVersionSchema,
    patchVersionSchema
);

// Apply hooks
if ((walkthroughVersionsService as any).hooks) {
    (walkthroughVersionsService as any).hooks(walkthroughVersionsHooks);
}
