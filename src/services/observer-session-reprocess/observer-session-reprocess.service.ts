import { drizzleAdapter } from '../../adapters';
import { ObserverSessionReprocessService } from './observer-session-reprocess.class';
import { observerSessionReprocessHooks } from './observer-session-reprocess.hooks';

export const observerSessionReprocessService = new ObserverSessionReprocessService(drizzleAdapter);
(observerSessionReprocessService as any).hooks(observerSessionReprocessHooks);
