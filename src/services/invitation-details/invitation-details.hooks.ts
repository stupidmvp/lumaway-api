import { getInvitationDetails } from './hooks/getInvitationDetails';

// invitation-details is a public endpoint — no authentication required
export const invitationDetailsHooks = {
    before: {
        all: [],
        get: [getInvitationDetails],
    },
};
