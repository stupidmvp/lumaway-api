import { drizzleAdapter } from '../../adapters';
import { InvitationAcceptService } from './invitation-accept.class';
import { invitationAcceptHooks } from './invitation-accept.hooks';

export const invitationAcceptService = new InvitationAcceptService(drizzleAdapter);
(invitationAcceptService as any).hooks(invitationAcceptHooks);

