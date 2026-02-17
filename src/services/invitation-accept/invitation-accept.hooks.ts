import { authenticate } from '../../hooks/authenticate';
import { acceptInvitation } from './hooks/acceptInvitation';

export const invitationAcceptHooks = {
    before: {
        all: [authenticate],
        create: [acceptInvitation],
    },
};
