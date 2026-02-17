import { sendResetEmail } from './hooks/sendResetEmail';

// auth-forgot-password is a public endpoint — no authentication required
export const authForgotPasswordHooks = {
    before: {
        all: [],
        create: [sendResetEmail],
    },
};
