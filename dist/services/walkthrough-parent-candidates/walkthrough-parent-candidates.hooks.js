"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkthroughParentCandidatesHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const findParentCandidates_1 = require("./hooks/findParentCandidates");
exports.walkthroughParentCandidatesHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [findParentCandidates_1.findParentCandidates],
    },
};
