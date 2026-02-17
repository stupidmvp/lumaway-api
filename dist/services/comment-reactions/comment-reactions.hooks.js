"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentReactionsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireProjectAccess_1 = require("../../hooks/requireProjectAccess");
const setReactionUserId_1 = require("./hooks/setReactionUserId");
const toggleReaction_1 = require("./hooks/toggleReaction");
const resolveProjectFromComment_1 = require("./hooks/resolveProjectFromComment");
const resolveProjectFromReaction_1 = require("./hooks/resolveProjectFromReaction");
const notifyOnReaction_1 = require("./hooks/notifyOnReaction");
exports.commentReactionsHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [],
        get: [],
        create: [
            setReactionUserId_1.setReactionUserId,
            resolveProjectFromComment_1.resolveProjectFromComment,
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'viewer', resolveProject: 'direct' }),
            toggleReaction_1.toggleReaction,
        ],
        patch: [],
        remove: [
            resolveProjectFromReaction_1.resolveProjectFromReaction,
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'viewer', resolveProject: 'direct' }),
        ],
    },
    after: {
        all: [],
        find: [],
        get: [],
        create: [notifyOnReaction_1.notifyOnReaction],
        patch: [],
        remove: [],
    },
};
