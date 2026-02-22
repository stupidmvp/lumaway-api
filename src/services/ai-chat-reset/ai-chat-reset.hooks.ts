import { handleReset } from './hooks/handleReset';

export const aiChatResetHooks = {
    before: {
        all: [],
        create: [handleReset],
    },
};
