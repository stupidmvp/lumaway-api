"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientWalkthroughsHooks = void 0;
const findPublishedWalkthroughs_1 = require("./hooks/findPublishedWalkthroughs");
// client-walkthroughs uses API key auth, not JWT — no standard authenticate hook
exports.clientWalkthroughsHooks = {
    before: {
        all: [],
        find: [findPublishedWalkthroughs_1.findPublishedWalkthroughs],
    },
};
