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
    // ── Notifications ────────────────────────────────────────────────────
    notifyOnPublish: zod_1.z.boolean().optional(),
    notifyOnNewMember: zod_1.z.boolean().optional(),
    notifyOnWalkthroughUpdate: zod_1.z.boolean().optional(),
}).strict();
exports.DEFAULT_PROJECT_SETTINGS = {
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
    // Notifications
    notifyOnPublish: true,
    notifyOnNewMember: true,
    notifyOnWalkthroughUpdate: false,
};
