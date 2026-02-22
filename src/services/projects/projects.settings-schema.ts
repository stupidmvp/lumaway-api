import { z } from 'zod';

// ── Project Settings Schema ──────────────────────────────────────────────
// Stores all project-level configuration (permissions, security, mode, assistant, member access)

export const projectSettingsSchema = z.object({
    // ── General ──────────────────────────────────────────────────────────
    description: z.string().max(500).optional(),

    // ── LumaWay Mode ─────────────────────────────────────────────────────
    // Controls how walkthroughs are delivered to end-users
    mode: z.enum(['guided', 'self-serve', 'hybrid']).optional(),

    // ── Assistant / Chatbot ──────────────────────────────────────────────
    assistantEnabled: z.boolean().optional(),
    assistantName: z.string().max(100).optional(),
    assistantWelcomeMessage: z.string().max(500).optional(),
    assistantSystemPrompt: z.string().max(2000).optional(), // System prompt for AI personality and business context
    chatbotEnabled: z.boolean().optional(),

    // ── Security ─────────────────────────────────────────────────────────
    requireApiKey: z.boolean().optional(),
    allowPublicAccess: z.boolean().optional(),
    allowedDomains: z.array(z.string()).optional(),
    ipWhitelist: z.array(z.string()).optional(),

    // ── Member Permissions ───────────────────────────────────────────────
    // Controls what each role (editor, viewer) can do within the project
    editorCanPublish: z.boolean().optional(),
    editorCanDelete: z.boolean().optional(),
    editorCanInvite: z.boolean().optional(),
    viewerCanComment: z.boolean().optional(),
    viewerCanExport: z.boolean().optional(),

    // ── Approval Workflow ────────────────────────────────────────────────
    approvalRequired: z.boolean().optional(),
    minApprovals: z.number().int().min(1).optional(),
    reviewerUserIds: z.array(z.string().uuid()).optional(),

    // ── Notifications — project lifecycle ───────────────────────────────
    notifyOnPublish: z.boolean().optional(),
    notifyOnNewMember: z.boolean().optional(),
    notifyOnWalkthroughUpdate: z.boolean().optional(),

    // ── LLM Configuration ──────────────────────────────────────────────
    // Only used when org plan is Enterprise + policy is 'project_delegated'.
    // Key is stored in tenant_llm_keys table, NOT here.
    llmProvider: z.enum(['google', 'groq', 'openai', 'anthropic']).optional(),
    llmModelId: z.string().max(100).optional(),

    // ── Notifications — comment activity ─────────────────────────────
    // Project-level gates: if OFF, no member receives this notification type
    notifyOnMention: z.boolean().optional(),
    notifyOnReply: z.boolean().optional(),
    notifyOnReaction: z.boolean().optional(),
    notifyOnCorrection: z.boolean().optional(),
    notifyOnResolved: z.boolean().optional(),
    notifyOnAnnouncement: z.boolean().optional(),

    // ── WebMCP Configuration ────────────────────────────────────────
    // Controls whether Luma can interact with the DOM via WebMCP
    webMCP: z.object({
        enabled: z.boolean().optional(),
        permissionLevel: z.enum(['none', 'readonly', 'guided', 'automatic']).optional(),
        allowedActions: z.array(z.enum(['click', 'fill', 'navigate', 'scroll', 'select'])).optional(),
        allowedSelectors: z.array(z.string()).optional(), // CSS selector whitelist
        blockedSelectors: z.array(z.string()).optional(), // CSS selector blacklist
        requireConfirmation: z.boolean().optional(), // Always ask before actions
    }).optional(),
}).strict();

export type ProjectSettings = z.infer<typeof projectSettingsSchema>;

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
    description: '',

    // Mode
    mode: 'guided',

    // Assistant / Chatbot
    assistantEnabled: false,
    assistantName: 'LumaWay Assistant',
    assistantWelcomeMessage: 'Hi! How can I help you today?',
    assistantSystemPrompt: undefined, // No default - each project defines its own personality
    chatbotEnabled: false,

    // Security
    requireApiKey: true,
    allowPublicAccess: false,
    allowedDomains: [],
    ipWhitelist: [],

    // Member Permissions
    editorCanPublish: true,
    editorCanDelete: false,
    editorCanInvite: true,
    viewerCanComment: true,
    viewerCanExport: true,

    // Approval Workflow
    approvalRequired: false,
    minApprovals: 1,
    reviewerUserIds: [],

    // Notifications — project lifecycle
    notifyOnPublish: true,
    notifyOnNewMember: true,
    notifyOnWalkthroughUpdate: false,

    // Notifications — comment activity (all ON by default)
    notifyOnMention: true,
    notifyOnReply: true,
    notifyOnReaction: true,
    notifyOnCorrection: true,
    notifyOnResolved: true,
    notifyOnAnnouncement: true,

    // WebMCP (disabled by default for security)
    webMCP: {
        enabled: false,
        permissionLevel: 'none',
        allowedActions: [],
        allowedSelectors: [],
        blockedSelectors: [],
        requireConfirmation: true,
    },
};


