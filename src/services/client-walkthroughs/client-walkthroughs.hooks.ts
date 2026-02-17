import { findPublishedWalkthroughs } from './hooks/findPublishedWalkthroughs';

// client-walkthroughs uses API key auth, not JWT — no standard authenticate hook
export const clientWalkthroughsHooks = {
    before: {
        all: [],
        find: [findPublishedWalkthroughs],
    },
};
