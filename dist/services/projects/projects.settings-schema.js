"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PROJECT_SETTINGS = exports.projectSettingsSchema = void 0;
const zod_1 = require("zod");
// ── Project Settings Schema ──────────────────────────────────────────────
// Stores all project-level configuration (permissions, security, mode, assistant, member access)
exports.projectSettingsSchema = zod_1.z.object({
    // ── General ──────────────────────────────────────────────────────────
    description: zod_1.z.string().max(500).optional(),
    // ── LumaWay Mode ─────────────────────────────────────────────────────
    // Controls how walkthroughs are delivered to end-users
    mode: zod_1.z.enum(['guided', 'self-serve', 'hybrid']).optional(),
    // ── Assistant / Chatbot ──────────────────────────────────────────────
    assistantEnabled: zod_1.z.boolean().optional(),
    assistantName: zod_1.z.string().max(100).optional(),
    assistantWelcomeMessage: zod_1.z.string().max(500).optional(),
    assistantSystemPrompt: zod_1.z.string().max(2000).optional(), // System prompt for AI personality and business context
    chatbotEnabled: zod_1.z.boolean().optional(),
    // ── Security ─────────────────────────────────────────────────────────
    requireApiKey: zod_1.z.boolean().optional(),
    allowPublicAccess: zod_1.z.boolean().optional(),
    allowedDomains: zod_1.z.array(zod_1.z.string()).optional(),
    ipWhitelist: zod_1.z.array(zod_1.z.string()).optional(),
    // ── Member Permissions ───────────────────────────────────────────────
    // Controls what each role (editor, viewer) can do within the project
    editorCanPublish: zod_1.z.boolean().optional(),
    editorCanDelete: zod_1.z.boolean().optional(),
    editorCanInvite: zod_1.z.boolean().optional(),
    viewerCanComment: zod_1.z.boolean().optional(),
    viewerCanExport: zod_1.z.boolean().optional(),
    // ── Approval Workflow ────────────────────────────────────────────────
    approvalRequired: zod_1.z.boolean().optional(),
    minApprovals: zod_1.z.number().int().min(1).optional(),
    reviewerUserIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    // ── Notifications — project lifecycle ───────────────────────────────
    notifyOnPublish: zod_1.z.boolean().optional(),
    notifyOnNewMember: zod_1.z.boolean().optional(),
    notifyOnWalkthroughUpdate: zod_1.z.boolean().optional(),
    // ── LLM Configuration ──────────────────────────────────────────────
    // Only used when org plan is Enterprise + policy is 'project_delegated'.
    // Key is stored in tenant_llm_keys table, NOT here.
    llmProvider: zod_1.z.enum(['google', 'groq', 'openai', 'anthropic']).optional(),
    llmModelId: zod_1.z.string().max(100).optional(),
    // ── Notifications — comment activity ─────────────────────────────
    // Project-level gates: if OFF, no member receives this notification type
    notifyOnMention: zod_1.z.boolean().optional(),
    notifyOnReply: zod_1.z.boolean().optional(),
    notifyOnReaction: zod_1.z.boolean().optional(),
    notifyOnCorrection: zod_1.z.boolean().optional(),
    notifyOnResolved: zod_1.z.boolean().optional(),
    notifyOnAnnouncement: zod_1.z.boolean().optional(),
    // ── WebMCP Configuration ────────────────────────────────────────
    // Controls whether Luma can interact with the DOM via WebMCP
    webMCP: zod_1.z.object({
        enabled: zod_1.z.boolean().optional(),
        permissionLevel: zod_1.z.enum(['none', 'readonly', 'guided', 'automatic']).optional(),
        allowedActions: zod_1.z.array(zod_1.z.enum(['click', 'fill', 'navigate', 'scroll', 'select'])).optional(),
        allowedSelectors: zod_1.z.array(zod_1.z.string()).optional(), // CSS selector whitelist
        blockedSelectors: zod_1.z.array(zod_1.z.string()).optional(), // CSS selector blacklist
        requireConfirmation: zod_1.z.boolean().optional(), // Always ask before actions
    }).optional(),
}).strict();
exports.DEFAULT_PROJECT_SETTINGS = {
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
