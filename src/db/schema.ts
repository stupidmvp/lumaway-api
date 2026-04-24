import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =====================================================
// SUBSCRIPTION PLANS
// =====================================================

export const subscriptionPlans = pgTable('subscription_plans', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),                                              // e.g., 'Free', 'Pro', 'Enterprise'
    tier: text('tier', { enum: ['free', 'pro', 'enterprise'] }).notNull(),
    llmModels: jsonb('llm_models').default([]).notNull(),                       // Allowed model IDs e.g., ['gemini-1.5-flash', 'llama-3.1-70b-versatile']
    maxRpm: integer('max_rpm').default(15).notNull(),                           // Rate limit: requests per minute
    maxTokensMonth: integer('max_tokens_month'),                                // Monthly token cap (null = unlimited)
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =====================================================
// SYSTEM CONFIG - SECRETS MANAGEMENT
// =====================================================

export const systemSecrets = pgTable('system_secrets', {
    id: uuid('id').defaultRandom().primaryKey(),
    keyName: text('key_name').notNull().unique(),       // e.g., 'GEMINI_KEY', 'GROQ_KEY'
    keyValue: text('key_value').notNull(),               // API key value (encrypt at rest in phase 2)
    provider: text('provider', { enum: ['google', 'groq', 'openai', 'anthropic'] }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =====================================================
// CORE ENTITIES - REGISTERED USERS & RBAC
// =====================================================

export const organizations = pgTable('organizations', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(), // URL-friendly identifier for the org
    logo: text('logo'), // S3 relative path for org logo
    planId: uuid('plan_id').references(() => subscriptionPlans.id), // Subscription plan (null = free)
    settings: jsonb('settings').default({}).notNull(), // Org-level settings (LLM policy, etc.)
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at')
});

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').references(() => organizations.id), // Users belong to an org
    email: text('email').unique().notNull(),
    password: text('password'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    avatar: text('avatar'),
    status: text('status', { enum: ['active', 'inactive', 'suspended'] }).notNull().default('active'),
    preferences: jsonb('preferences').default({}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at')
});

export const roles = pgTable('roles', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at')
});

export const userRoles = pgTable('user_roles', {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at')
}, (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] })
}));

export const modules = pgTable('modules', {
    id: uuid('id').defaultRandom().primaryKey(),
    moduleId: uuid('module_id').references((): any => modules.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    key: text('key').notNull(),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at')
});

export const permissions = pgTable('permissions', {
    id: uuid('id').defaultRandom().primaryKey(),
    moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at')
});

export const rolePermissions = pgTable('role_permissions', {
    roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at')
}, (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] })
}));

// =====================================================
// ORGANIZATION MEMBERSHIP (M:N Users <-> Organizations)
// =====================================================

export const organizationMembers = pgTable('organization_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    role: text('role', { enum: ['owner', 'admin', 'member'] }).notNull().default('member'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueMember: uniqueIndex('organization_members_org_user_idx').on(table.organizationId, table.userId),
}));

// =====================================================
// LUMAWAY DOMAIN ENTITIES
// =====================================================

export const projects = pgTable('projects', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').references(() => organizations.id).notNull(), // Projects belong to an org
    name: text('name').notNull(),
    logo: text('logo'), // S3 relative path for project logo
    ownerId: uuid('owner_id').references(() => users.id), // Optional: creator of the project
    status: text('status', { enum: ['active', 'archived'] }).notNull().default('active'),
    settings: jsonb('settings').default({}).notNull(), // Project-level settings (permissions, mode, assistant, etc.)
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
    key: text('key').primaryKey(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').default('Default Key').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const walkthroughs = pgTable('walkthroughs', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    parentId: uuid('parent_id').references((): any => walkthroughs.id, { onDelete: 'set null' }),
    previousWalkthroughId: uuid('previous_walkthrough_id').references((): any => walkthroughs.id, { onDelete: 'set null' }),
    nextWalkthroughId: uuid('next_walkthrough_id').references((): any => walkthroughs.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'), // Plain text summary — used for AI context, search, and embeddings
    content: jsonb('content'), // Lexical editor state JSON — rich content source of truth
    steps: jsonb('steps').default([]).notNull(),
    tags: jsonb('tags').default([]).notNull(),
    order: integer('order').default(0).notNull(),
    trigger: jsonb('trigger'), // { type: 'route' | 'interaction' | 'intent', value: string }
    executionMode: text('execution_mode', { enum: ['automatic', 'suggestion', 'manual'] }).default('automatic'),
    repeatable: boolean('repeatable').default(false),
    isPublished: boolean('is_published').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const actors = pgTable('actors', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(), // Machine-friendly key used by the SDK (e.g., "admin", "sales-rep")
    description: text('description'),
    color: text('color'), // Optional color for UI badges
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    uniqueSlug: uniqueIndex('actors_project_slug_idx').on(table.projectId, table.slug),
}));

export const walkthroughActors = pgTable('walkthrough_actors', {
    walkthroughId: uuid('walkthrough_id').references(() => walkthroughs.id, { onDelete: 'cascade' }).notNull(),
    actorId: uuid('actor_id').references(() => actors.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.walkthroughId, table.actorId] }),
}));

export const walkthroughVersions = pgTable('walkthrough_versions', {
    id: uuid('id').defaultRandom().primaryKey(),
    walkthroughId: uuid('walkthrough_id').references(() => walkthroughs.id, { onDelete: 'cascade' }).notNull(),
    versionNumber: integer('version_number').notNull(),
    title: text('title').notNull(),
    steps: jsonb('steps').default([]).notNull(),
    status: text('status', { enum: ['draft', 'pending_approval', 'approved', 'rejected', 'published'] }).notNull().default('draft'),
    isPublished: boolean('is_published').default(false),
    requestedApprovalAt: timestamp('requested_approval_at'),
    approvedAt: timestamp('approved_at'),
    approvedBy: uuid('approved_by').references(() => users.id),
    rejectionReason: text('rejection_reason'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    restoredFrom: uuid('restored_from').references((): any => walkthroughVersions.id),
});

export const walkthroughApprovals = pgTable('walkthrough_approvals', {
    id: uuid('id').defaultRandom().primaryKey(),
    versionId: uuid('version_id').references(() => walkthroughVersions.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueApproval: uniqueIndex('walkthrough_approvals_version_user_idx').on(table.versionId, table.userId),
}));

export const observerSessions = pgTable('observer_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    intent: text('intent'),
    status: text('status', {
        enum: ['recording', 'uploaded', 'processing', 'ready_for_review', 'failed', 'cancelled']
    }).notNull().default('recording'),
    videoS3Key: text('video_s3_key'),
    captureSource: text('capture_source', {
        enum: ['dom', 'webmcp', 'hybrid', 'unknown']
    }).notNull().default('dom'),
    videoDurationMs: integer('video_duration_ms'),
    processingSummary: jsonb('processing_summary').default({}).notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    endedAt: timestamp('ended_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    byProject: index('observer_sessions_project_idx').on(table.projectId),
    byStatus: index('observer_sessions_status_idx').on(table.status),
}));

export const observerEvents = pgTable('observer_events', {
    id: uuid('id').defaultRandom().primaryKey(),
    observerSessionId: uuid('observer_session_id').references(() => observerSessions.id, { onDelete: 'cascade' }).notNull(),
    type: text('type', {
        enum: ['click', 'input', 'change', 'navigation', 'scroll', 'custom']
    }).notNull(),
    timestampMs: integer('timestamp_ms').notNull(),
    url: text('url'),
    targetSelector: text('target_selector'),
    label: text('label'),
    payload: jsonb('payload').default({}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    bySessionTimestamp: index('observer_events_session_ts_idx').on(table.observerSessionId, table.timestampMs),
}));

export const observerChapters = pgTable('observer_chapters', {
    id: uuid('id').defaultRandom().primaryKey(),
    observerSessionId: uuid('observer_session_id').references(() => observerSessions.id, { onDelete: 'cascade' }).notNull(),
    startMs: integer('start_ms').notNull(),
    endMs: integer('end_ms').notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    bySessionStart: index('observer_chapters_session_start_idx').on(table.observerSessionId, table.startMs),
}));

export const observerStepCandidates = pgTable('observer_step_candidates', {
    id: uuid('id').defaultRandom().primaryKey(),
    observerSessionId: uuid('observer_session_id').references(() => observerSessions.id, { onDelete: 'cascade' }).notNull(),
    order: integer('order').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    targetSelector: text('target_selector'),
    timestampMs: integer('timestamp_ms').notNull(),
    confidence: integer('confidence').default(0).notNull(), // 0..100
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    bySessionOrder: index('observer_step_candidates_session_order_idx').on(table.observerSessionId, table.order),
}));

// =====================================================
// PROJECT MEMBERSHIP & COLLABORATION
// =====================================================

export const projectMembers = pgTable('project_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    role: text('role', { enum: ['owner', 'editor', 'viewer'] }).notNull().default('viewer'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueMember: uniqueIndex('project_members_project_user_idx').on(table.projectId, table.userId),
}));

export const comments = pgTable('comments', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),

    // Polymorphic target: what is being commented on
    targetType: text('target_type', {
        enum: ['project', 'walkthrough', 'walkthrough_step']
    }).notNull().default('project'),
    targetId: text('target_id'),      // UUID of the target entity (null for project-level)
    stepId: text('step_id'),          // For walkthrough_step: the step.id inside the JSON

    // Authoring
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    content: text('content').notNull(),
    type: text('type', {
        enum: ['comment', 'correction', 'announcement']
    }).notNull().default('comment'),

    // Threading
    parentId: uuid('parent_id').references((): any => comments.id, { onDelete: 'cascade' }),

    // Lifecycle
    status: text('status', {
        enum: ['active', 'archived', 'deleted']
    }).notNull().default('active'),
    isEdited: boolean('is_edited').default(false),
    isResolved: boolean('is_resolved').default(false),

    // Audit timestamps
    archivedAt: timestamp('archived_at'),
    archivedBy: uuid('archived_by').references(() => users.id, { onDelete: 'set null' }),
    deletedAt: timestamp('deleted_at'),
    deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const commentAttachments = pgTable('comment_attachments', {
    id: uuid('id').defaultRandom().primaryKey(),
    commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }).notNull(),
    fileName: text('file_name').notNull(),
    fileType: text('file_type').notNull(),       // MIME type
    fileSize: integer('file_size').notNull(),     // Bytes
    s3Key: text('s3_key').notNull(),              // Relative S3 path
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const commentMentions = pgTable('comment_mentions', {
    id: uuid('id').defaultRandom().primaryKey(),
    commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }).notNull(),
    mentionedUserId: uuid('mentioned_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueMention: uniqueIndex('comment_mentions_comment_user_idx').on(table.commentId, table.mentionedUserId),
}));

export const commentReactions = pgTable('comment_reactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    emoji: text('emoji').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueReaction: uniqueIndex('comment_reactions_comment_user_emoji_idx').on(table.commentId, table.userId, table.emoji),
}));

// =====================================================
// PROJECT FAVORITES (User <-> Project)
// =====================================================

export const projectFavorites = pgTable('project_favorites', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueFavorite: uniqueIndex('project_favorites_project_user_idx').on(table.projectId, table.userId),
}));

// =====================================================
// INVITATIONS & NOTIFICATIONS
// =====================================================

export const projectInvitations = pgTable('project_invitations', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    email: text('email').notNull(),
    role: text('role', { enum: ['owner', 'editor', 'viewer'] }).notNull().default('viewer'),
    status: text('status', { enum: ['pending', 'accepted', 'rejected', 'expired'] }).notNull().default('pending'),
    token: text('token').unique().notNull(),
    invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueInvite: uniqueIndex('project_invitations_project_email_idx').on(table.projectId, table.email),
}));

export const notifications = pgTable('notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    type: text('type', {
        enum: [
            'project_invitation',
            'invitation_accepted',
            'mention',
            'comment_reply',
            'reaction',
            'correction',
            'comment_resolved',
            'announcement',
        ]
    }).notNull(),
    title: text('title').notNull(),
    body: text('body'),
    metadata: jsonb('metadata').default({}),
    read: boolean('read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =====================================================
// TENANT LLM KEYS (Scoped API keys for AI providers)
// =====================================================

export const tenantLlmKeys = pgTable('tenant_llm_keys', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    provider: text('provider', { enum: ['google', 'groq', 'openai', 'anthropic'] }).notNull(),
    modelId: text('model_id').notNull(),                                        // e.g., 'gpt-4o', 'claude-sonnet-4-20250514'
    encryptedApiKey: text('encrypted_api_key').notNull(),                        // AES-256-GCM encrypted
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    uniqueOrgProvider: uniqueIndex('tenant_llm_keys_org_provider_idx').on(table.organizationId, table.provider),
    uniqueProjectProvider: uniqueIndex('tenant_llm_keys_project_provider_idx').on(table.projectId, table.provider),
}));

// =====================================================
// RELATIONS
// =====================================================

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
    organizations: many(organizations),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
    plan: one(subscriptionPlans, {
        fields: [organizations.planId],
        references: [subscriptionPlans.id]
    }),
    users: many(users),
    projects: many(projects),
    members: many(organizationMembers),
    llmKeys: many(tenantLlmKeys),
}));

export const tenantLlmKeysRelations = relations(tenantLlmKeys, ({ one }) => ({
    organization: one(organizations, {
        fields: [tenantLlmKeys.organizationId],
        references: [organizations.id]
    }),
    project: one(projects, {
        fields: [tenantLlmKeys.projectId],
        references: [projects.id]
    }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [users.organizationId],
        references: [organizations.id]
    }),
    userRoles: many(userRoles),
    projects: many(projects), // Projects created by user
    organizationMemberships: many(organizationMembers),
    projectFavorites: many(projectFavorites),
    observerSessions: many(observerSessions),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
    organization: one(organizations, {
        fields: [organizationMembers.organizationId],
        references: [organizations.id]
    }),
    user: one(users, {
        fields: [organizationMembers.userId],
        references: [users.id]
    })
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [projects.organizationId],
        references: [organizations.id]
    }),
    owner: one(users, {
        fields: [projects.ownerId],
        references: [users.id]
    }),
    walkthroughs: many(walkthroughs),
    apiKeys: many(apiKeys),
    members: many(projectMembers),
    invitations: many(projectInvitations),
    comments: many(comments),
    actors: many(actors),
    favorites: many(projectFavorites),
    observerSessions: many(observerSessions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
    userRoles: many(userRoles),
    rolePermissions: many(rolePermissions)
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(users, {
        fields: [userRoles.userId],
        references: [users.id]
    }),
    role: one(roles, {
        fields: [userRoles.roleId],
        references: [roles.id]
    })
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
    parentModule: one(modules, {
        fields: [modules.moduleId],
        references: [modules.id]
    }),
    subModules: many(modules),
    permissions: many(permissions)
}));

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
    module: one(modules, {
        fields: [permissions.moduleId],
        references: [modules.id]
    }),
    rolePermissions: many(rolePermissions)
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, {
        fields: [rolePermissions.roleId],
        references: [roles.id]
    }),
    permission: one(permissions, {
        fields: [rolePermissions.permissionId],
        references: [permissions.id]
    })
}));

export const walkthroughsRelations = relations(walkthroughs, ({ one, many }) => ({
    project: one(projects, {
        fields: [walkthroughs.projectId],
        references: [projects.id]
    }),
    parent: one(walkthroughs, {
        fields: [walkthroughs.parentId],
        references: [walkthroughs.id],
        relationName: 'children'
    }),
    children: many(walkthroughs, {
        relationName: 'children'
    }),
    previousWalkthrough: one(walkthroughs, {
        fields: [walkthroughs.previousWalkthroughId],
        references: [walkthroughs.id],
        relationName: 'nextOf'
    }),
    nextWalkthrough: one(walkthroughs, {
        fields: [walkthroughs.nextWalkthroughId],
        references: [walkthroughs.id],
        relationName: 'previousOf'
    }),
    versions: many(walkthroughVersions),
    walkthroughActors: many(walkthroughActors),
}));

export const actorsRelations = relations(actors, ({ one, many }) => ({
    project: one(projects, {
        fields: [actors.projectId],
        references: [projects.id]
    }),
    walkthroughActors: many(walkthroughActors),
}));

export const walkthroughActorsRelations = relations(walkthroughActors, ({ one }) => ({
    walkthrough: one(walkthroughs, {
        fields: [walkthroughActors.walkthroughId],
        references: [walkthroughs.id]
    }),
    actor: one(actors, {
        fields: [walkthroughActors.actorId],
        references: [actors.id]
    }),
}));

export const walkthroughVersionsRelations = relations(walkthroughVersions, ({ one, many }) => ({
    walkthrough: one(walkthroughs, {
        fields: [walkthroughVersions.walkthroughId],
        references: [walkthroughs.id]
    }),
    creator: one(users, {
        fields: [walkthroughVersions.createdBy],
        references: [users.id]
    }),
    restoredFromVersion: one(walkthroughVersions, {
        fields: [walkthroughVersions.restoredFrom],
        references: [walkthroughVersions.id]
    }),
    approvals: many(walkthroughApprovals)
}));

export const walkthroughApprovalsRelations = relations(walkthroughApprovals, ({ one }) => ({
    version: one(walkthroughVersions, {
        fields: [walkthroughApprovals.versionId],
        references: [walkthroughVersions.id]
    }),
    user: one(users, {
        fields: [walkthroughApprovals.userId],
        references: [users.id]
    })
}));

export const observerSessionsRelations = relations(observerSessions, ({ one, many }) => ({
    project: one(projects, {
        fields: [observerSessions.projectId],
        references: [projects.id]
    }),
    creator: one(users, {
        fields: [observerSessions.createdBy],
        references: [users.id]
    }),
    events: many(observerEvents),
    chapters: many(observerChapters),
    stepCandidates: many(observerStepCandidates),
}));

export const observerEventsRelations = relations(observerEvents, ({ one }) => ({
    session: one(observerSessions, {
        fields: [observerEvents.observerSessionId],
        references: [observerSessions.id]
    }),
}));

export const observerChaptersRelations = relations(observerChapters, ({ one }) => ({
    session: one(observerSessions, {
        fields: [observerChapters.observerSessionId],
        references: [observerSessions.id]
    }),
}));

export const observerStepCandidatesRelations = relations(observerStepCandidates, ({ one }) => ({
    session: one(observerSessions, {
        fields: [observerStepCandidates.observerSessionId],
        references: [observerSessions.id]
    }),
}));

export const projectFavoritesRelations = relations(projectFavorites, ({ one }) => ({
    project: one(projects, {
        fields: [projectFavorites.projectId],
        references: [projects.id]
    }),
    user: one(users, {
        fields: [projectFavorites.userId],
        references: [users.id]
    })
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
    project: one(projects, {
        fields: [projectMembers.projectId],
        references: [projects.id]
    }),
    user: one(users, {
        fields: [projectMembers.userId],
        references: [users.id]
    })
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
    project: one(projects, {
        fields: [comments.projectId],
        references: [projects.id]
    }),
    user: one(users, {
        fields: [comments.userId],
        references: [users.id]
    }),
    parent: one(comments, {
        fields: [comments.parentId],
        references: [comments.id],
        relationName: 'replies'
    }),
    replies: many(comments, {
        relationName: 'replies'
    }),
    attachments: many(commentAttachments),
    mentions: many(commentMentions),
    reactions: many(commentReactions),
}));

export const commentAttachmentsRelations = relations(commentAttachments, ({ one }) => ({
    comment: one(comments, {
        fields: [commentAttachments.commentId],
        references: [comments.id]
    }),
    uploader: one(users, {
        fields: [commentAttachments.uploadedBy],
        references: [users.id]
    }),
}));

export const commentMentionsRelations = relations(commentMentions, ({ one }) => ({
    comment: one(comments, {
        fields: [commentMentions.commentId],
        references: [comments.id]
    }),
    mentionedUser: one(users, {
        fields: [commentMentions.mentionedUserId],
        references: [users.id]
    }),
}));

export const commentReactionsRelations = relations(commentReactions, ({ one }) => ({
    comment: one(comments, {
        fields: [commentReactions.commentId],
        references: [comments.id]
    }),
    user: one(users, {
        fields: [commentReactions.userId],
        references: [users.id]
    }),
}));

export const projectInvitationsRelations = relations(projectInvitations, ({ one }) => ({
    project: one(projects, {
        fields: [projectInvitations.projectId],
        references: [projects.id]
    }),
    inviter: one(users, {
        fields: [projectInvitations.invitedBy],
        references: [users.id]
    })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id]
    })
}));
