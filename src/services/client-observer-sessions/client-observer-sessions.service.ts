import { drizzleAdapter } from '../../adapters';
import { ClientObserverSessionsService } from './client-observer-sessions.class';
import { clientObserverSessionsHooks } from './client-observer-sessions.hooks';

export const clientObserverSessionsService = new ClientObserverSessionsService(drizzleAdapter);
(clientObserverSessionsService as any).hooks(clientObserverSessionsHooks);
