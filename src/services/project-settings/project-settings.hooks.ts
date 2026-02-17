import { authenticate } from '../../hooks/authenticate';

export const projectSettingsHooks = {
    before: {
        all: [authenticate],
    },
};

