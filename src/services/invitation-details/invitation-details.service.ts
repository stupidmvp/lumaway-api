import { drizzleAdapter } from '../../adapters';
import { InvitationDetailsService } from './invitation-details.class';
import { invitationDetailsHooks } from './invitation-details.hooks';

export const invitationDetailsService = new InvitationDetailsService(drizzleAdapter);
(invitationDetailsService as any).hooks(invitationDetailsHooks);

