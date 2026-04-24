import { eq, and, type SQL } from 'drizzle-orm';
import { db } from '../../adapters';
import { organizations, projects, subscriptionPlans, tenantLlmKeys } from '../../db/schema';
import { decryptApiKey } from '../../utils/encryption';
import { LLMService, groqLLM, type LLMProviderName } from './llm.service';
import type { LLMProviderConfig } from './llm-provider.interface';
import type { OrgSettings } from '../../services/organizations/organizations.settings-schema';

// Provider enum type matching the DB column
type ProviderEnum = 'google' | 'groq' | 'openai' | 'anthropic';

export interface ResolvedProviderApiKey {
    provider: LLMProviderName;
    apiKey: string;
    modelId?: string;
    source: 'project' | 'organization';
}

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
export async function resolveLLM(orgId: string, projectId?: string): Promise<LLMService> {
    // 1. Fetch org with its subscription plan (two separate queries to avoid leftJoin typing issues)
    const orgRows = await db
        .select({ settings: organizations.settings, planId: organizations.planId })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

    const org = orgRows[0];
    if (!org) {
        return groqLLM;
    }

    // Resolve plan tier
    let tier: string = 'free';
    if (org.planId) {
        const planRows = await db
            .select({ tier: subscriptionPlans.tier })
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, org.planId))
            .limit(1);
        if (planRows[0]) {
            tier = planRows[0].tier;
        }
    }

    // 2. Free tier → return default free instance
    if (tier === 'free') {
        return groqLLM;
    }

    // 3. Pro tier → system keys with pro models
    if (tier === 'pro') {
        return LLMService.for('gemini', { modelId: 'gemini-1.5-pro' }, 'paid');
    }

    // 4. Enterprise tier → resolve based on org policy
    const orgSettings = (org.settings ?? {}) as OrgSettings;
    const policy = orgSettings.llmPolicy ?? 'free_only';

    if (policy === 'free_only') {
        return groqLLM;
    }

    if (policy === 'org_enforced') {
        const resolved = await resolveKeyForScope('organization', orgId, orgSettings.llmProvider, orgSettings.llmModelId);
        if (resolved) {
            return LLMService.for(resolved.provider, resolved.config, 'paid');
        }
        return groqLLM;
    }

    if (policy === 'project_delegated' && projectId) {
        const resolved = await resolveProjectConfig(projectId);
        if (resolved) {
            return LLMService.for(resolved.provider, resolved.config, 'paid');
        }
    }

    return groqLLM;
}

// ── Internal helpers ──────────────────────────────────────────────────────

interface ResolvedConfig {
    provider: LLMProviderName;
    config: LLMProviderConfig;
}

async function resolveKeyForScope(
    scope: 'organization' | 'project',
    scopeId: string,
    provider?: string,
    modelId?: string,
): Promise<ResolvedConfig | null> {
    if (!provider) return null;

    const typedProvider = provider as ProviderEnum;

    const conditions: SQL[] = [
        eq(tenantLlmKeys.provider, typedProvider),
        eq(tenantLlmKeys.isActive, true),
    ];

    if (scope === 'organization') {
        conditions.push(eq(tenantLlmKeys.organizationId, scopeId));
    } else {
        conditions.push(eq(tenantLlmKeys.projectId, scopeId));
    }

    const rows = await db
        .select()
        .from(tenantLlmKeys)
        .where(and(...conditions))
        .limit(1);

    const key = rows[0];
    if (!key) return null;

    return {
        provider: provider as LLMProviderName,
        config: {
            apiKey: decryptApiKey(key.encryptedApiKey),
            modelId: modelId ?? key.modelId,
        },
    };
}

async function resolveProjectConfig(projectId: string): Promise<ResolvedConfig | null> {
    const rows = await db
        .select({ settings: projects.settings })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

    const proj = rows[0];
    if (!proj) return null;

    const projSettings = (proj.settings ?? {}) as { llmProvider?: string; llmModelId?: string };
    if (!projSettings.llmProvider) return null;

    return resolveKeyForScope('project', projectId, projSettings.llmProvider, projSettings.llmModelId);
}

/**
 * Resolve a raw provider API key for a project scope, with org fallback.
 *
 * This is useful for APIs that are not routed through `generateText/generateObject`
 * (for example, transcription endpoints that require direct HTTP calls).
 */
export async function resolveProviderApiKeyForProject(
    projectId: string,
    provider: LLMProviderName
): Promise<ResolvedProviderApiKey | null> {
    const projectRows = await db
        .select({ organizationId: projects.organizationId })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

    const project = projectRows[0];
    if (!project) return null;

    const projectKeyRows = await db
        .select({
            encryptedApiKey: tenantLlmKeys.encryptedApiKey,
            modelId: tenantLlmKeys.modelId,
        })
        .from(tenantLlmKeys)
        .where(and(
            eq(tenantLlmKeys.projectId, projectId),
            eq(tenantLlmKeys.provider, provider as ProviderEnum),
            eq(tenantLlmKeys.isActive, true),
        ))
        .limit(1);

    const projectKey = projectKeyRows[0];
    if (projectKey) {
        return {
            provider,
            apiKey: decryptApiKey(projectKey.encryptedApiKey),
            modelId: projectKey.modelId,
            source: 'project',
        };
    }

    const orgKeyRows = await db
        .select({
            encryptedApiKey: tenantLlmKeys.encryptedApiKey,
            modelId: tenantLlmKeys.modelId,
        })
        .from(tenantLlmKeys)
        .where(and(
            eq(tenantLlmKeys.organizationId, project.organizationId),
            eq(tenantLlmKeys.provider, provider as ProviderEnum),
            eq(tenantLlmKeys.isActive, true),
        ))
        .limit(1);

    const orgKey = orgKeyRows[0];
    if (!orgKey) return null;

    return {
        provider,
        apiKey: decryptApiKey(orgKey.encryptedApiKey),
        modelId: orgKey.modelId,
        source: 'organization',
    };
}
