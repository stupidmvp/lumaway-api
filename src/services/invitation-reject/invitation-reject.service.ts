import { drizzleAdapter } from '../../adapters';
import { InvitationRejectService } from './invitation-reject.class';
import { invitationRejectHooks } from './invitation-reject.hooks';

export const invitationRejectService = new InvitationRejectService(drizzleAdapter);
(invitationRejectService as any).hooks(invitationRejectHooks);

