"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const requireProjectAccess_1 = require("../../hooks/requireProjectAccess");
const populateCommentUser_1 = require("./hooks/populateCommentUser");
const enforceCommentOwnership_1 = require("./hooks/enforceCommentOwnership");
const setCommentUserId_1 = require("./hooks/setCommentUserId");
const resolveProjectFromComment_1 = require("./hooks/resolveProjectFromComment");
const processMentionsAndNotify_1 = require("./hooks/processMentionsAndNotify");
const createAttachments_1 = require("./hooks/createAttachments");
const handleCommentLifecycle_1 = require("./hooks/handleCommentLifecycle");
const filterActiveComments_1 = require("./hooks/filterActiveComments");
const stripAttachmentsFromData_1 = require("./hooks/stripAttachmentsFromData");
const removeAttachments_1 = require("./hooks/removeAttachments");
exports.commentsHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [
            // Any project member can read comments (projectId must be in query)
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'viewer', resolveProject: 'direct' }),
            filterActiveComments_1.filterActiveComments,
        ],
        get: [],
        create: [
            // Any project member can create comments (projectId is in data)
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'viewer', resolveProject: 'direct' }),
            setCommentUserId_1.setCommentUserId,
            stripAttachmentsFromData_1.stripAttachmentsFromData,
        ],
        patch: [
            // Resolve projectId from the comment record, then check project access
            resolveProjectFromComment_1.resolveProjectFromComment,
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'viewer', resolveProject: 'direct' }),
            enforceCommentOwnership_1.enforceCommentOwnership,
            removeAttachments_1.removeAttachments,
            handleCommentLifecycle_1.handleCommentLifecycle,
        ],
        remove: [
            resolveProjectFromComment_1.resolveProjectFromComment,
            (0, requireProjectAccess_1.requireProjectAccess)({ minRole: 'viewer', resolveProject: 'direct' }),
            enforceCommentOwnership_1.enforceCommentOwnership,
        ],
    },
    after: {
        all: [populateCommentUser_1.populateCommentUser],
        create: [
            createAttachments_1.createAttachments,
            processMentionsAndNotify_1.processMentionsAndNotify,
        ],
        patch: [
            handleCommentLifecycle_1.handleLifecycleNotifications,
        ],
    },
};
