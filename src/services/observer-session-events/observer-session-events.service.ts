import { drizzleAdapter } from '../../adapters';
import { ObserverSessionEventsService } from './observer-session-events.class';
import { observerSessionEventsHooks } from './observer-session-events.hooks';

export const observerSessionEventsService = new ObserverSessionEventsService(drizzleAdapter);
(observerSessionEventsService as any).hooks(observerSessionEventsHooks);
