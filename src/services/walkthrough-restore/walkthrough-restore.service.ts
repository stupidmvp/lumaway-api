import { drizzleAdapter } from '../../adapters';
import { WalkthroughRestoreService } from './walkthrough-restore.class';
import { createWalkthroughRestoreHooks } from './walkthrough-restore.hooks';

export const walkthroughRestoreService = new WalkthroughRestoreService(drizzleAdapter);
walkthroughRestoreService.hooks(createWalkthroughRestoreHooks(walkthroughRestoreService));
