import { z } from 'zod';

// ── User Preferences Schema ──────────────────────────────────────────────
export const userPreferencesSchema = z.object({
    // Appearance
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.enum(['en', 'es']).optional(),

    // General
    defaultHomePage: z.enum(['projects', 'walkthroughs']).optional(),
    displayNames: z.enum(['fullName', 'firstName', 'email']).optional(),
    firstDayOfWeek: z.enum(['monday', 'sunday']).optional(),

    // Notifications — master toggle
    emailNotifications: z.boolean().optional(),
    notifyOnInvitation: z.boolean().optional(),
    notifyOnMemberJoin: z.boolean().optional(),

    // Notifications — per-type email controls (social-media style)
    emailOnMention: z.boolean().optional(),
    emailOnReply: z.boolean().optional(),
    emailOnReaction: z.boolean().optional(),
    emailOnCorrection: z.boolean().optional(),
    emailOnResolved: z.boolean().optional(),
    emailOnAnnouncement: z.boolean().optional(),

    // Editor
    editorSidebarOpen: z.boolean().optional(),
    defaultStepPlacement: z.enum(['auto', 'top', 'bottom', 'left', 'right']).optional(),

    // Onboarding
    onboardingCompleted: z.boolean().optional(),
}).strict();

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

export const DEFAULT_PREFERENCES: UserPreferences = {
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
    emailOnReaction: false,       // Reactions are noisy — email OFF by default (social-media style)
    emailOnCorrection: true,
    emailOnResolved: true,
    emailOnAnnouncement: true,
    editorSidebarOpen: true,
    defaultStepPlacement: 'bottom',
    onboardingCompleted: false,
};

// ── User CRUD Schemas ────────────────────────────────────────────────────
export const userCreateSchema = z.object({
    email: z.string().email(),
    password: z.string().optional(),
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    avatar: z.string().optional().nullable(),
    status: z.enum(['active', 'inactive', 'suspended']).default('active'),
    preferences: userPreferencesSchema.optional(),
});

export const userPatchSchema = userCreateSchema.partial();
