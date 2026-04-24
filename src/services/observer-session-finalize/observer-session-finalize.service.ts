import { drizzleAdapter } from '../../adapters';
import { ObserverSessionFinalizeService } from './observer-session-finalize.class';
import { observerSessionFinalizeHooks } from './observer-session-finalize.hooks';

export const observerSessionFinalizeService = new ObserverSessionFinalizeService(drizzleAdapter);
(observerSessionFinalizeService as any).hooks(observerSessionFinalizeHooks);
