import { authenticate } from '../../hooks/authenticate';
import { rejectInvitation } from './hooks/rejectInvitation';

export const invitationRejectHooks = {
    before: {
        all: [authenticate],
        create: [rejectInvitation],
    },
};
