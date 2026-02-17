import { resetPassword } from './hooks/resetPassword';

// auth-reset-password is a public endpoint — no authentication required
export const authResetPasswordHooks = {
    before: {
        all: [],
        create: [resetPassword],
    },
};
