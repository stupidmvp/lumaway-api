import { authenticate } from '../../hooks/authenticate';
import { changePassword } from './hooks/changePassword';

export const authChangePasswordHooks = {
    before: {
        all: [authenticate],
        create: [changePassword],
    },
};
