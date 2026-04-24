import { drizzleAdapter } from '../../adapters';
import { ObserverGenerateWalkthroughService } from './observer-generate-walkthrough.class';
import { observerGenerateWalkthroughHooks } from './observer-generate-walkthrough.hooks';

export const observerGenerateWalkthroughService = new ObserverGenerateWalkthroughService(drizzleAdapter);
(observerGenerateWalkthroughService as any).hooks(observerGenerateWalkthroughHooks);
