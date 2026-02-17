import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';
import { prepareInvitation } from './hooks/prepareInvitation';
import { checkDuplicateInvitation } from './hooks/checkDuplicateInvitation';
import { sendInvitationEmail } from './hooks/sendInvitationEmail';
import { createInvitationNotification } from './hooks/createInvitationNotification';
import { populateInvitationRelations } from './hooks/populateInvitationRelations';

export const projectInvitationsHooks = {
    before: {
        all: [authenticate],
        find: [
            // Any member can see invitations for their project
            requireProjectAccess({ minRole: 'viewer', resolveProject: 'direct' }),
        ],
        get: [],
        create: [
            // Only owners can invite
            requireProjectAccess({ minRole: 'owner', resolveProject: 'direct' }),
            checkDuplicateInvitation,
            prepareInvitation,
        ],
        patch: [
            // Only owners can modify invitations
            requireProjectAccess({ minRole: 'owner', resolveProject: 'direct' }),
        ],
        remove: [
            // Only owners can revoke invitations
            requireProjectAccess({ minRole: 'owner', resolveProject: 'direct' }),
        ],
    },
    after: {
        all: [populateInvitationRelations],
        create: [sendInvitationEmail, createInvitationNotification],
    },
};


