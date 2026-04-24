import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { tenantLlmKeys } from '../../db/schema';
import { and, eq } from 'drizzle-orm';
import { encryptApiKey } from '../../utils/encryption';

export class TenantLlmKeysService extends DrizzleService<typeof tenantLlmKeys> {
    private adapter: DrizzleAdapter;

    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
        this.adapter = storage;
    }

    async create(data: any, params?: any): Promise<any> {
        const provider = data?.provider as string | undefined;
        const projectId = data?.projectId as string | undefined;
        const organizationId = data?.organizationId as string | undefined;
        const modelId = data?.modelId as string | undefined;
        const apiKey = data?.apiKey as string | undefined;

        const hasProjectScope = Boolean(projectId);
        const hasOrganizationScope = Boolean(organizationId);
        if (hasProjectScope === hasOrganizationScope) {
            const error: any = new Error('Exactly one of organizationId or projectId must be provided');
            error.name = 'ValidationError';
            error.statusCode = 400;
            throw error;
        }
        if (!provider || !['google', 'groq', 'openai', 'anthropic'].includes(provider)) {
            const error: any = new Error('provider is required and must be one of: google, groq, openai, anthropic');
            error.name = 'ValidationError';
            error.statusCode = 400;
            throw error;
        }
        if (!modelId || String(modelId).length > 100) {
            const error: any = new Error('modelId is required and must be at most 100 characters');
            error.name = 'ValidationError';
            error.statusCode = 400;
            throw error;
        }
        if (!apiKey || !String(apiKey).trim()) {
            const error: any = new Error('apiKey is required');
            error.name = 'ValidationError';
            error.statusCode = 400;
            throw error;
        }

        let encryptedApiKey: string;
        try {
            encryptedApiKey = encryptApiKey(String(apiKey).trim());
        } catch (e) {
            const error: any = new Error((e as Error)?.message || 'Failed to encrypt API key');
            error.name = 'ValidationError';
            error.statusCode = 400;
            throw error;
        }

        const db = (this.adapter as any).db;
        const whereClause = hasProjectScope
            ? and(eq(tenantLlmKeys.projectId, projectId!), eq(tenantLlmKeys.provider, provider as any))
            : and(eq(tenantLlmKeys.organizationId, organizationId!), eq(tenantLlmKeys.provider, provider as any));

        const [existing] = await db
            .select({ id: tenantLlmKeys.id })
            .from(tenantLlmKeys)
            .where(whereClause)
            .limit(1);

        if (!existing) {
            const [created] = await db
                .insert(tenantLlmKeys)
                .values({
                    projectId: hasProjectScope ? projectId! : null,
                    organizationId: hasOrganizationScope ? organizationId! : null,
                    provider,
                    modelId,
                    encryptedApiKey,
                    isActive: data.isActive ?? true,
                    updatedAt: new Date(),
                })
                .returning();
            return created;
        }

        const patchData: any = {
            modelId,
            isActive: data.isActive ?? true,
            updatedAt: new Date(),
        };
        patchData.encryptedApiKey = encryptedApiKey;

        const [updated] = await db
            .update(tenantLlmKeys)
            .set(patchData)
            .where(eq(tenantLlmKeys.id, existing.id))
            .returning();

        return updated;
    }

    async patch(id: string, data: any, _params?: any): Promise<any> {
        if (!id) {
            const error: any = new Error('id is required');
            error.name = 'ValidationError';
            error.statusCode = 400;
            throw error;
        }

        const db = (this.adapter as any).db;
        const [existing] = await db
            .select({ id: tenantLlmKeys.id })
            .from(tenantLlmKeys)
            .where(eq(tenantLlmKeys.id, id))
            .limit(1);

        if (!existing) {
            const error: any = new Error('Tenant LLM key not found');
            error.name = 'NotFound';
            error.statusCode = 404;
            throw error;
        }

        const patchData: any = { updatedAt: new Date() };

        if (typeof data?.modelId !== 'undefined') {
            if (!String(data.modelId).trim() || String(data.modelId).length > 100) {
                const error: any = new Error('modelId must be at most 100 characters');
                error.name = 'ValidationError';
                error.statusCode = 400;
                throw error;
            }
            patchData.modelId = String(data.modelId).trim();
        }

        if (typeof data?.isActive !== 'undefined') {
            patchData.isActive = Boolean(data.isActive);
        }

        if (typeof data?.apiKey !== 'undefined') {
            if (!String(data.apiKey).trim()) {
                const error: any = new Error('apiKey cannot be empty');
                error.name = 'ValidationError';
                error.statusCode = 400;
                throw error;
            }
            try {
                patchData.encryptedApiKey = encryptApiKey(String(data.apiKey).trim());
            } catch (e) {
                const error: any = new Error((e as Error)?.message || 'Failed to encrypt API key');
                error.name = 'ValidationError';
                error.statusCode = 400;
                throw error;
            }
        }

        const [updated] = await db
            .update(tenantLlmKeys)
            .set(patchData)
            .where(eq(tenantLlmKeys.id, id))
            .returning();

        return updated;
    }
}
