import { authenticate } from '../../hooks/authenticate';
import { requireProjectAccess } from '../../hooks/requireProjectAccess';
import { populateCommentUser } from './hooks/populateCommentUser';
import { enforceCommentOwnership } from './hooks/enforceCommentOwnership';
import { setCommentUserId } from './hooks/setCommentUserId';
import { resolveProjectFromComment } from './hooks/resolveProjectFromComment';
import { processMentionsAndNotify } from './hooks/processMentionsAndNotify';
import { createAttachments } from './hooks/createAttachments';
import { handleCommentLifecycle, handleLifecycleNotifications } from './hooks/handleCommentLifecycle';
import { filterActiveComments } from './hooks/filterActiveComments';
import { advancedFilterComments } from './hooks/advancedFilterComments';
import { stripAttachmentsFromData } from './hooks/stripAttachmentsFromData';
import { removeAttachments } from './hooks/removeAttachments';

export const commentsHooks = {
    before: {
        all: [authenticate],
        find: [
            // Any project member can read comments (projectId must be in query)
            requireProjectAccess({ minRole: 'viewer', resolveProject: 'direct' }),
            filterActiveComments,
            // Handle search, authorId, dateFrom, dateTo — must run after filterActiveComments
            advancedFilterComments,
        ],
        get: [],
        create: [
            // Any project member can create comments (projectId is in data)
            requireProjectAccess({ minRole: 'viewer', resolveProject: 'direct' }),
            setCommentUserId,
            stripAttachmentsFromData,
        ],
        patch: [
            // Resolve projectId from the comment record, then check project access
            resolveProjectFromComment,
            requireProjectAccess({ minRole: 'viewer', resolveProject: 'direct' }),
            enforceCommentOwnership,
            removeAttachments,
            handleCommentLifecycle,
        ],
        remove: [
            resolveProjectFromComment,
            requireProjectAccess({ minRole: 'viewer', resolveProject: 'direct' }),
            enforceCommentOwnership,
        ],
    },
    after: {
        all: [],
        find: [populateCommentUser],
        get: [populateCommentUser],
        create: [
            createAttachments,
            processMentionsAndNotify,
            populateCommentUser,
        ],
        patch: [
            handleLifecycleNotifications,
            populateCommentUser,
        ],
        remove: [populateCommentUser],
    },
};
