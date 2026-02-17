import { authenticate } from '../../hooks/authenticate';
import { leaveOrganization } from './hooks/leaveOrganization';

export const userOrganizationLeaveHooks = {
    before: {
        all: [authenticate],
        create: [leaveOrganization],
    },
};
