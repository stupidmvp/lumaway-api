import { authenticate } from '../../hooks/authenticate';
import { findParentCandidates } from './hooks/findParentCandidates';

export const walkthroughParentCandidatesHooks = {
    before: {
        all: [authenticate],
        find: [findParentCandidates],
    },
};

