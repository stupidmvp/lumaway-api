import { findPublishedWalkthroughs } from './hooks/findPublishedWalkthroughs';
import { patchWalkthroughTrigger } from './hooks/patchWalkthroughTrigger';

// client-walkthroughs uses API key auth, not JWT — no standard authenticate hook
export const clientWalkthroughsHooks = {
    before: {
        all: [],
        find: [findPublishedWalkthroughs],
        patch: [patchWalkthroughTrigger],
    },
};
