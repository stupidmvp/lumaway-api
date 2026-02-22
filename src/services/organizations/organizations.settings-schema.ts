import { z } from 'zod';

// ── Organization Settings Schema ──────────────────────────────────────────
// Stores org-level configuration. LLM policy is only relevant for Enterprise tier.

export const orgSettingsSchema = z.object({
    // ── LLM Policy ─────────────────────────────────────────────────────────
    // Controls how LLM credentials are resolved for projects in this org.
    // Only configurable when org is on Enterprise plan.
    //   - org_enforced:       All projects use the org's LLM key/model
    //   - project_delegated:  Each project can set its own LLM config, fallback to free tier
    //   - free_only:          Restrict to free tier (default for free/pro plans)
    llmPolicy: z.enum(['org_enforced', 'project_delegated', 'free_only']).optional(),

    // Preferred provider/model when org_enforced (key stored in tenant_llm_keys)
    llmProvider: z.enum(['google', 'groq', 'openai', 'anthropic']).optional(),
    llmModelId: z.string().max(100).optional(),
}).strict();

export type OrgSettings = z.infer<typeof orgSettingsSchema>;

export const DEFAULT_ORG_SETTINGS: OrgSettings = {
    llmPolicy: 'free_only',
};
