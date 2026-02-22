import { findClientProjectConfig } from './hooks/findClientProjectConfig';

export const clientProjectHooks = {
    before: {
        all: [],
        find: [findClientProjectConfig],
    },
};
