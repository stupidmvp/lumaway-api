"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRelations = exports.projectInvitationsRelations = exports.commentMentionsRelations = exports.commentAttachmentsRelations = exports.commentsRelations = exports.projectMembersRelations = exports.walkthroughVersionsRelations = exports.walkthroughsRelations = exports.rolePermissionsRelations = exports.permissionsRelations = exports.modulesRelations = exports.userRolesRelations = exports.rolesRelations = exports.projectsRelations = exports.organizationMembersRelations = exports.usersRelations = exports.organizationsRelations = exports.notifications = exports.projectInvitations = exports.commentMentions = exports.commentAttachments = exports.comments = exports.projectMembers = exports.walkthroughVersions = exports.walkthroughs = exports.apiKeys = exports.projects = exports.organizationMembers = exports.rolePermissions = exports.permissions = exports.modules = exports.userRoles = exports.roles = exports.users = exports.organizations = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
// =====================================================
// CORE ENTITIES - REGISTERED USERS & RBAC
// =====================================================
exports.organizations = (0, pg_core_1.pgTable)('organizations', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    slug: (0, pg_core_1.text)('slug').unique().notNull(), // URL-friendly identifier for the org
    logo: (0, pg_core_1.text)('logo'), // S3 relative path for org logo
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at')
});
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)('organization_id').references(() => exports.organizations.id), // Users belong to an org
    email: (0, pg_core_1.text)('email').unique().notNull(),
    password: (0, pg_core_1.text)('password'),
    firstName: (0, pg_core_1.text)('first_name'),
    lastName: (0, pg_core_1.text)('last_name'),
    avatar: (0, pg_core_1.text)('avatar'),
    status: (0, pg_core_1.text)('status', { enum: ['active', 'inactive', 'suspended'] }).notNull().default('active'),
    preferences: (0, pg_core_1.jsonb)('preferences').default({}).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at')
});
exports.roles = (0, pg_core_1.pgTable)('roles', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)('name').notNull().unique(),
    description: (0, pg_core_1.text)('description'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at')
});
exports.userRoles = (0, pg_core_1.pgTable)('user_roles', {
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    roleId: (0, pg_core_1.uuid)('role_id').notNull().references(() => exports.roles.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at')
}, (table) => ({
    pk: (0, pg_core_1.primaryKey)({ columns: [table.userId, table.roleId] })
}));
exports.modules = (0, pg_core_1.pgTable)('modules', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    moduleId: (0, pg_core_1.uuid)('module_id').references(() => exports.modules.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    key: (0, pg_core_1.text)('key').notNull(),
    status: (0, pg_core_1.text)('status').notNull().default('active'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at')
});
exports.permissions = (0, pg_core_1.pgTable)('permissions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    moduleId: (0, pg_core_1.uuid)('module_id').notNull().references(() => exports.modules.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at')
});
exports.rolePermissions = (0, pg_core_1.pgTable)('role_permissions', {
    roleId: (0, pg_core_1.uuid)('role_id').notNull().references(() => exports.roles.id, { onDelete: 'cascade' }),
    permissionId: (0, pg_core_1.uuid)('permission_id').notNull().references(() => exports.permissions.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at')
}, (table) => ({
    pk: (0, pg_core_1.primaryKey)({ columns: [table.roleId, table.permissionId] })
}));
// =====================================================
// ORGANIZATION MEMBERSHIP (M:N Users <-> Organizations)
// =====================================================
exports.organizationMembers = (0, pg_core_1.pgTable)('organization_members', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)('organization_id').references(() => exports.organizations.id, { onDelete: 'cascade' }).notNull(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    role: (0, pg_core_1.text)('role', { enum: ['owner', 'admin', 'member'] }).notNull().default('member'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueMember: (0, pg_core_1.uniqueIndex)('organization_members_org_user_idx').on(table.organizationId, table.userId),
}));
// =====================================================
// LUMAWAY DOMAIN ENTITIES
// =====================================================
exports.projects = (0, pg_core_1.pgTable)('projects', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)('organization_id').references(() => exports.organizations.id).notNull(), // Projects belong to an org
    name: (0, pg_core_1.text)('name').notNull(),
    ownerId: (0, pg_core_1.uuid)('owner_id').references(() => exports.users.id), // Optional: creator of the project
    status: (0, pg_core_1.text)('status', { enum: ['active', 'archived'] }).notNull().default('active'),
    settings: (0, pg_core_1.jsonb)('settings').default({}).notNull(), // Project-level settings (permissions, mode, assistant, etc.)
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.apiKeys = (0, pg_core_1.pgTable)('api_keys', {
    key: (0, pg_core_1.text)('key').primaryKey(),
    projectId: (0, pg_core_1.uuid)('project_id').references(() => exports.projects.id, { onDelete: 'cascade' }).notNull(),
    name: (0, pg_core_1.text)('name').default('Default Key').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.walkthroughs = (0, pg_core_1.pgTable)('walkthroughs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    projectId: (0, pg_core_1.uuid)('project_id').references(() => exports.projects.id, { onDelete: 'cascade' }).notNull(),
    parentId: (0, pg_core_1.uuid)('parent_id').references(() => exports.walkthroughs.id, { onDelete: 'set null' }),
    previousWalkthroughId: (0, pg_core_1.uuid)('previous_walkthrough_id').references(() => exports.walkthroughs.id, { onDelete: 'set null' }),
    nextWalkthroughId: (0, pg_core_1.uuid)('next_walkthrough_id').references(() => exports.walkthroughs.id, { onDelete: 'set null' }),
    title: (0, pg_core_1.text)('title').notNull(),
    steps: (0, pg_core_1.jsonb)('steps').default([]).notNull(),
    order: (0, pg_core_1.integer)('order').default(0).notNull(),
    isPublished: (0, pg_core_1.boolean)('is_published').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.walkthroughVersions = (0, pg_core_1.pgTable)('walkthrough_versions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    walkthroughId: (0, pg_core_1.uuid)('walkthrough_id').references(() => exports.walkthroughs.id, { onDelete: 'cascade' }).notNull(),
    versionNumber: (0, pg_core_1.integer)('version_number').notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    steps: (0, pg_core_1.jsonb)('steps').default([]).notNull(),
    isPublished: (0, pg_core_1.boolean)('is_published').default(false),
    createdBy: (0, pg_core_1.uuid)('created_by').references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    restoredFrom: (0, pg_core_1.uuid)('restored_from').references(() => exports.walkthroughVersions.id),
});
// =====================================================
// PROJECT MEMBERSHIP & COLLABORATION
// =====================================================
exports.projectMembers = (0, pg_core_1.pgTable)('project_members', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    projectId: (0, pg_core_1.uuid)('project_id').references(() => exports.projects.id, { onDelete: 'cascade' }).notNull(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    role: (0, pg_core_1.text)('role', { enum: ['owner', 'editor', 'viewer'] }).notNull().default('viewer'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueMember: (0, pg_core_1.uniqueIndex)('project_members_project_user_idx').on(table.projectId, table.userId),
}));
exports.comments = (0, pg_core_1.pgTable)('comments', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    projectId: (0, pg_core_1.uuid)('project_id').references(() => exports.projects.id, { onDelete: 'cascade' }).notNull(),
    // Polymorphic target: what is being commented on
    targetType: (0, pg_core_1.text)('target_type', {
        enum: ['project', 'walkthrough', 'walkthrough_step']
    }).notNull().default('project'),
    targetId: (0, pg_core_1.text)('target_id'), // UUID of the target entity (null for project-level)
    stepId: (0, pg_core_1.text)('step_id'), // For walkthrough_step: the step.id inside the JSON
    // Authoring
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    content: (0, pg_core_1.text)('content').notNull(),
    type: (0, pg_core_1.text)('type', {
        enum: ['comment', 'correction', 'announcement']
    }).notNull().default('comment'),
    // Threading
    parentId: (0, pg_core_1.uuid)('parent_id').references(() => exports.comments.id, { onDelete: 'cascade' }),
    // Lifecycle
    status: (0, pg_core_1.text)('status', {
        enum: ['active', 'archived', 'deleted']
    }).notNull().default('active'),
    isEdited: (0, pg_core_1.boolean)('is_edited').default(false),
    isResolved: (0, pg_core_1.boolean)('is_resolved').default(false),
    // Audit timestamps
    archivedAt: (0, pg_core_1.timestamp)('archived_at'),
    archivedBy: (0, pg_core_1.uuid)('archived_by').references(() => exports.users.id, { onDelete: 'set null' }),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
    deletedBy: (0, pg_core_1.uuid)('deleted_by').references(() => exports.users.id, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.commentAttachments = (0, pg_core_1.pgTable)('comment_attachments', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    commentId: (0, pg_core_1.uuid)('comment_id').references(() => exports.comments.id, { onDelete: 'cascade' }).notNull(),
    fileName: (0, pg_core_1.text)('file_name').notNull(),
    fileType: (0, pg_core_1.text)('file_type').notNull(), // MIME type
    fileSize: (0, pg_core_1.integer)('file_size').notNull(), // Bytes
    s3Key: (0, pg_core_1.text)('s3_key').notNull(), // Relative S3 path
    uploadedBy: (0, pg_core_1.uuid)('uploaded_by').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.commentMentions = (0, pg_core_1.pgTable)('comment_mentions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    commentId: (0, pg_core_1.uuid)('comment_id').references(() => exports.comments.id, { onDelete: 'cascade' }).notNull(),
    mentionedUserId: (0, pg_core_1.uuid)('mentioned_user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueMention: (0, pg_core_1.uniqueIndex)('comment_mentions_comment_user_idx').on(table.commentId, table.mentionedUserId),
}));
// =====================================================
// INVITATIONS & NOTIFICATIONS
// =====================================================
exports.projectInvitations = (0, pg_core_1.pgTable)('project_invitations', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    projectId: (0, pg_core_1.uuid)('project_id').references(() => exports.projects.id, { onDelete: 'cascade' }).notNull(),
    email: (0, pg_core_1.text)('email').notNull(),
    role: (0, pg_core_1.text)('role', { enum: ['owner', 'editor', 'viewer'] }).notNull().default('viewer'),
    status: (0, pg_core_1.text)('status', { enum: ['pending', 'accepted', 'rejected', 'expired'] }).notNull().default('pending'),
    token: (0, pg_core_1.text)('token').unique().notNull(),
    invitedBy: (0, pg_core_1.uuid)('invited_by').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueInvite: (0, pg_core_1.uniqueIndex)('project_invitations_project_email_idx').on(table.projectId, table.email),
}));
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    type: (0, pg_core_1.text)('type', {
        enum: [
            'project_invitation',
            'invitation_accepted',
            'mention',
            'comment_reply',
            'correction',
            'comment_resolved',
            'announcement',
        ]
    }).notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    body: (0, pg_core_1.text)('body'),
    metadata: (0, pg_core_1.jsonb)('metadata').default({}),
    read: (0, pg_core_1.boolean)('read').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// =====================================================
// RELATIONS
// =====================================================
exports.organizationsRelations = (0, drizzle_orm_1.relations)(exports.organizations, ({ many }) => ({
    users: many(exports.users),
    projects: many(exports.projects),
    members: many(exports.organizationMembers),
}));
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ one, many }) => ({
    organization: one(exports.organizations, {
        fields: [exports.users.organizationId],
        references: [exports.organizations.id]
    }),
    userRoles: many(exports.userRoles),
    projects: many(exports.projects), // Projects created by user
    organizationMemberships: many(exports.organizationMembers),
}));
exports.organizationMembersRelations = (0, drizzle_orm_1.relations)(exports.organizationMembers, ({ one }) => ({
    organization: one(exports.organizations, {
        fields: [exports.organizationMembers.organizationId],
        references: [exports.organizations.id]
    }),
    user: one(exports.users, {
        fields: [exports.organizationMembers.userId],
        references: [exports.users.id]
    })
}));
exports.projectsRelations = (0, drizzle_orm_1.relations)(exports.projects, ({ one, many }) => ({
    organization: one(exports.organizations, {
        fields: [exports.projects.organizationId],
        references: [exports.organizations.id]
    }),
    owner: one(exports.users, {
        fields: [exports.projects.ownerId],
        references: [exports.users.id]
    }),
    walkthroughs: many(exports.walkthroughs),
    apiKeys: many(exports.apiKeys),
    members: many(exports.projectMembers),
    invitations: many(exports.projectInvitations),
    comments: many(exports.comments),
}));
exports.rolesRelations = (0, drizzle_orm_1.relations)(exports.roles, ({ many }) => ({
    userRoles: many(exports.userRoles),
    rolePermissions: many(exports.rolePermissions)
}));
exports.userRolesRelations = (0, drizzle_orm_1.relations)(exports.userRoles, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.userRoles.userId],
        references: [exports.users.id]
    }),
    role: one(exports.roles, {
        fields: [exports.userRoles.roleId],
        references: [exports.roles.id]
    })
}));
exports.modulesRelations = (0, drizzle_orm_1.relations)(exports.modules, ({ one, many }) => ({
    parentModule: one(exports.modules, {
        fields: [exports.modules.moduleId],
        references: [exports.modules.id]
    }),
    subModules: many(exports.modules),
    permissions: many(exports.permissions)
}));
exports.permissionsRelations = (0, drizzle_orm_1.relations)(exports.permissions, ({ one, many }) => ({
    module: one(exports.modules, {
        fields: [exports.permissions.moduleId],
        references: [exports.modules.id]
    }),
    rolePermissions: many(exports.rolePermissions)
}));
exports.rolePermissionsRelations = (0, drizzle_orm_1.relations)(exports.rolePermissions, ({ one }) => ({
    role: one(exports.roles, {
        fields: [exports.rolePermissions.roleId],
        references: [exports.roles.id]
    }),
    permission: one(exports.permissions, {
        fields: [exports.rolePermissions.permissionId],
        references: [exports.permissions.id]
    })
}));
exports.walkthroughsRelations = (0, drizzle_orm_1.relations)(exports.walkthroughs, ({ one, many }) => ({
    project: one(exports.projects, {
        fields: [exports.walkthroughs.projectId],
        references: [exports.projects.id]
    }),
    parent: one(exports.walkthroughs, {
        fields: [exports.walkthroughs.parentId],
        references: [exports.walkthroughs.id],
        relationName: 'children'
    }),
    children: many(exports.walkthroughs, {
        relationName: 'children'
    }),
    previousWalkthrough: one(exports.walkthroughs, {
        fields: [exports.walkthroughs.previousWalkthroughId],
        references: [exports.walkthroughs.id],
        relationName: 'nextOf'
    }),
    nextWalkthrough: one(exports.walkthroughs, {
        fields: [exports.walkthroughs.nextWalkthroughId],
        references: [exports.walkthroughs.id],
        relationName: 'previousOf'
    }),
    versions: many(exports.walkthroughVersions)
}));
exports.walkthroughVersionsRelations = (0, drizzle_orm_1.relations)(exports.walkthroughVersions, ({ one }) => ({
    walkthrough: one(exports.walkthroughs, {
        fields: [exports.walkthroughVersions.walkthroughId],
        references: [exports.walkthroughs.id]
    }),
    creator: one(exports.users, {
        fields: [exports.walkthroughVersions.createdBy],
        references: [exports.users.id]
    }),
    restoredFromVersion: one(exports.walkthroughVersions, {
        fields: [exports.walkthroughVersions.restoredFrom],
        references: [exports.walkthroughVersions.id]
    })
}));
exports.projectMembersRelations = (0, drizzle_orm_1.relations)(exports.projectMembers, ({ one }) => ({
    project: one(exports.projects, {
        fields: [exports.projectMembers.projectId],
        references: [exports.projects.id]
    }),
    user: one(exports.users, {
        fields: [exports.projectMembers.userId],
        references: [exports.users.id]
    })
}));
exports.commentsRelations = (0, drizzle_orm_1.relations)(exports.comments, ({ one, many }) => ({
    project: one(exports.projects, {
        fields: [exports.comments.projectId],
        references: [exports.projects.id]
    }),
    user: one(exports.users, {
        fields: [exports.comments.userId],
        references: [exports.users.id]
    }),
    parent: one(exports.comments, {
        fields: [exports.comments.parentId],
        references: [exports.comments.id],
        relationName: 'replies'
    }),
    replies: many(exports.comments, {
        relationName: 'replies'
    }),
    attachments: many(exports.commentAttachments),
    mentions: many(exports.commentMentions),
}));
exports.commentAttachmentsRelations = (0, drizzle_orm_1.relations)(exports.commentAttachments, ({ one }) => ({
    comment: one(exports.comments, {
        fields: [exports.commentAttachments.commentId],
        references: [exports.comments.id]
    }),
    uploader: one(exports.users, {
        fields: [exports.commentAttachments.uploadedBy],
        references: [exports.users.id]
    }),
}));
exports.commentMentionsRelations = (0, drizzle_orm_1.relations)(exports.commentMentions, ({ one }) => ({
    comment: one(exports.comments, {
        fields: [exports.commentMentions.commentId],
        references: [exports.comments.id]
    }),
    mentionedUser: one(exports.users, {
        fields: [exports.commentMentions.mentionedUserId],
        references: [exports.users.id]
    }),
}));
exports.projectInvitationsRelations = (0, drizzle_orm_1.relations)(exports.projectInvitations, ({ one }) => ({
    project: one(exports.projects, {
        fields: [exports.projectInvitations.projectId],
        references: [exports.projects.id]
    }),
    inviter: one(exports.users, {
        fields: [exports.projectInvitations.invitedBy],
        references: [exports.users.id]
    })
}));
exports.notificationsRelations = (0, drizzle_orm_1.relations)(exports.notifications, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.notifications.userId],
        references: [exports.users.id]
    })
}));
