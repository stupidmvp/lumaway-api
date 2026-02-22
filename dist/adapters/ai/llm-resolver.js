"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLLM = resolveLLM;
const drizzle_orm_1 = require("drizzle-orm");
const adapters_1 = require("../../adapters");
const schema_1 = require("../../db/schema");
const encryption_1 = require("../../utils/encryption");
const llm_service_1 = require("./llm.service");
/**
 * LLM Resolver - Multi-tenant credential resolution.
 *
 * Resolution cascade:
 *   1. org plan = free       → free tier (gemini-flash, system keys)
 *   2. org plan = pro        → pro models with system keys
 *   3. org plan = enterprise →
 *      a. policy = org_enforced      → org's key & model
 *      b. policy = project_delegated → project's key & model, fallback free
 *      c. default                    → free tier
 */
async function resolveLLM(orgId, projectId) {
    // 1. Fetch org with its subscription plan (two separate queries to avoid leftJoin typing issues)
    const orgRows = await adapters_1.db
        .select({ settings: schema_1.organizations.settings, planId: schema_1.organizations.planId })
        .from(schema_1.organizations)
        .where((0, drizzle_orm_1.eq)(schema_1.organizations.id, orgId))
        .limit(1);
    const org = orgRows[0];
    if (!org) {
        return llm_service_1.groqLLM;
    }
    // Resolve plan tier
    let tier = 'free';
    if (org.planId) {
        const planRows = await adapters_1.db
            .select({ tier: schema_1.subscriptionPlans.tier })
            .from(schema_1.subscriptionPlans)
            .where((0, drizzle_orm_1.eq)(schema_1.subscriptionPlans.id, org.planId))
            .limit(1);
        if (planRows[0]) {
            tier = planRows[0].tier;
        }
    }
    // 2. Free tier → return default free instance
    if (tier === 'free') {
        return llm_service_1.groqLLM;
    }
    // 3. Pro tier → system keys with pro models
    if (tier === 'pro') {
        return llm_service_1.LLMService.for('gemini', { modelId: 'gemini-1.5-pro' }, 'paid');
    }
    // 4. Enterprise tier → resolve based on org policy
    const orgSettings = (org.settings ?? {});
    const policy = orgSettings.llmPolicy ?? 'free_only';
    if (policy === 'free_only') {
        return llm_service_1.groqLLM;
    }
    if (policy === 'org_enforced') {
        const resolved = await resolveKeyForScope('organization', orgId, orgSettings.llmProvider, orgSettings.llmModelId);
        if (resolved) {
            return llm_service_1.LLMService.for(resolved.provider, resolved.config, 'paid');
        }
        return llm_service_1.groqLLM;
    }
    if (policy === 'project_delegated' && projectId) {
        const resolved = await resolveProjectConfig(projectId);
        if (resolved) {
            return llm_service_1.LLMService.for(resolved.provider, resolved.config, 'paid');
        }
    }
    return llm_service_1.groqLLM;
}
async function resolveKeyForScope(scope, scopeId, provider, modelId) {
    if (!provider)
        return null;
    const typedProvider = provider;
    const conditions = [
        (0, drizzle_orm_1.eq)(schema_1.tenantLlmKeys.provider, typedProvider),
        (0, drizzle_orm_1.eq)(schema_1.tenantLlmKeys.isActive, true),
    ];
    if (scope === 'organization') {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.tenantLlmKeys.organizationId, scopeId));
    }
    else {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.tenantLlmKeys.projectId, scopeId));
    }
    const rows = await adapters_1.db
        .select()
        .from(schema_1.tenantLlmKeys)
        .where((0, drizzle_orm_1.and)(...conditions))
        .limit(1);
    const key = rows[0];
    if (!key)
        return null;
    return {
        provider: provider,
        config: {
            apiKey: (0, encryption_1.decryptApiKey)(key.encryptedApiKey),
            modelId: modelId ?? key.modelId,
        },
    };
}
async function resolveProjectConfig(projectId) {
    const rows = await adapters_1.db
        .select({ settings: schema_1.projects.settings })
        .from(schema_1.projects)
        .where((0, drizzle_orm_1.eq)(schema_1.projects.id, projectId))
        .limit(1);
    const proj = rows[0];
    if (!proj)
        return null;
    const projSettings = (proj.settings ?? {});
    if (!projSettings.llmProvider)
        return null;
    return resolveKeyForScope('project', projectId, projSettings.llmProvider, projSettings.llmModelId);
}
