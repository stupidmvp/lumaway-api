import { registerUser } from './hooks/registerUser';

// auth-register is a public endpoint — no authentication required
export const authRegisterHooks = {
    before: {
        all: [],
        create: [registerUser],
    },
};
