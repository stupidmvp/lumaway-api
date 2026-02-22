"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ORG_SETTINGS = exports.orgSettingsSchema = void 0;
const zod_1 = require("zod");
// ── Organization Settings Schema ──────────────────────────────────────────
// Stores org-level configuration. LLM policy is only relevant for Enterprise tier.
exports.orgSettingsSchema = zod_1.z.object({
    // ── LLM Policy ─────────────────────────────────────────────────────────
    // Controls how LLM credentials are resolved for projects in this org.
    // Only configurable when org is on Enterprise plan.
    //   - org_enforced:       All projects use the org's LLM key/model
    //   - project_delegated:  Each project can set its own LLM config, fallback to free tier
    //   - free_only:          Restrict to free tier (default for free/pro plans)
    llmPolicy: zod_1.z.enum(['org_enforced', 'project_delegated', 'free_only']).optional(),
    // Preferred provider/model when org_enforced (key stored in tenant_llm_keys)
    llmProvider: zod_1.z.enum(['google', 'groq', 'openai', 'anthropic']).optional(),
    llmModelId: zod_1.z.string().max(100).optional(),
}).strict();
exports.DEFAULT_ORG_SETTINGS = {
    llmPolicy: 'free_only',
};
