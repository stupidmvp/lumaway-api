import { findClientWalkthroughVersions } from './hooks/findClientWalkthroughVersions';

export const clientWalkthroughVersionsHooks = {
    before: {
        all: [],
        find: [findClientWalkthroughVersions],
    },
};
