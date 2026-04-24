import { drizzleAdapter } from '../../adapters';
import { ObserverSessionReviewService } from './observer-session-review.class';
import { observerSessionReviewHooks } from './observer-session-review.hooks';

export const observerSessionReviewService = new ObserverSessionReviewService(drizzleAdapter);
(observerSessionReviewService as any).hooks(observerSessionReviewHooks);
