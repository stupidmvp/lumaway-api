import { drizzleAdapter } from '../../adapters';
import { WalkthroughParentCandidatesService } from './walkthrough-parent-candidates.class';
import { walkthroughParentCandidatesHooks } from './walkthrough-parent-candidates.hooks';

export const walkthroughParentCandidatesService = new WalkthroughParentCandidatesService(drizzleAdapter);
(walkthroughParentCandidatesService as any).hooks(walkthroughParentCandidatesHooks);

