"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userPatchSchema = exports.userCreateSchema = exports.DEFAULT_PREFERENCES = exports.userPreferencesSchema = void 0;
const zod_1 = require("zod");
// ── User Preferences Schema ──────────────────────────────────────────────
exports.userPreferencesSchema = zod_1.z.object({
    // Appearance
    theme: zod_1.z.enum(['light', 'dark', 'system']).optional(),
    language: zod_1.z.enum(['en', 'es']).optional(),
    // General
    defaultHomePage: zod_1.z.enum(['projects', 'walkthroughs']).optional(),
    displayNames: zod_1.z.enum(['fullName', 'firstName', 'email']).optional(),
    firstDayOfWeek: zod_1.z.enum(['monday', 'sunday']).optional(),
    // Notifications — master toggle
    emailNotifications: zod_1.z.boolean().optional(),
    notifyOnInvitation: zod_1.z.boolean().optional(),
    notifyOnMemberJoin: zod_1.z.boolean().optional(),
    // Notifications — per-type email controls (social-media style)
    emailOnMention: zod_1.z.boolean().optional(),
    emailOnReply: zod_1.z.boolean().optional(),
    emailOnReaction: zod_1.z.boolean().optional(),
    emailOnCorrection: zod_1.z.boolean().optional(),
    emailOnResolved: zod_1.z.boolean().optional(),
    emailOnAnnouncement: zod_1.z.boolean().optional(),
    // Editor
    editorSidebarOpen: zod_1.z.boolean().optional(),
    defaultStepPlacement: zod_1.z.enum(['auto', 'top', 'bottom', 'left', 'right']).optional(),
    // Onboarding
    onboardingCompleted: zod_1.z.boolean().optional(),
}).strict();
exports.DEFAULT_PREFERENCES = {
    theme: 'system',
    language: 'en',
    defaultHomePage: 'projects',
    displayNames: 'fullName',
    firstDayOfWeek: 'monday',
    emailNotifications: true,
    notifyOnInvitation: true,
    notifyOnMemberJoin: true,
    emailOnMention: true,
    emailOnReply: true,
    emailOnReaction: false, // Reactions are noisy — email OFF by default (social-media style)
    emailOnCorrection: true,
    emailOnResolved: true,
    emailOnAnnouncement: true,
    editorSidebarOpen: true,
    defaultStepPlacement: 'bottom',
    onboardingCompleted: false,
};
// ── User CRUD Schemas ────────────────────────────────────────────────────
exports.userCreateSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().optional(),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().optional(),
    avatar: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(['active', 'inactive', 'suspended']).default('active'),
    preferences: exports.userPreferencesSchema.optional(),
});
exports.userPatchSchema = exports.userCreateSchema.partial();
