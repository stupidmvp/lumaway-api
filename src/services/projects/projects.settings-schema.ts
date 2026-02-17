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

    // ── Notifications — project lifecycle ───────────────────────────────
    notifyOnPublish: z.boolean().optional(),
    notifyOnNewMember: z.boolean().optional(),
    notifyOnWalkthroughUpdate: z.boolean().optional(),

    // ── Notifications — comment activity ─────────────────────────────
    // Project-level gates: if OFF, no member receives this notification type
    notifyOnMention: z.boolean().optional(),
    notifyOnReply: z.boolean().optional(),
    notifyOnReaction: z.boolean().optional(),
    notifyOnCorrection: z.boolean().optional(),
    notifyOnResolved: z.boolean().optional(),
    notifyOnAnnouncement: z.boolean().optional(),
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
};


