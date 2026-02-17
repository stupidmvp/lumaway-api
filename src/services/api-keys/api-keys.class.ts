import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { eq } from 'drizzle-orm';
import { apiKeys } from '../../db/schema';

export class ApiKeysService extends DrizzleService<typeof apiKeys> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }

    /**
     * Override get — base class hardcodes getColumn('id'), but our PK is `key`.
     */
    async get(id: string, params?: any) {
        const result = await (this as any).storage
            .select()
            .from((this as any).table)
            .where(eq((this as any).getColumn('key'), id))
            .limit(1);

        if (result.length === 0) {
            throw new Error(`API key not found`);
        }
        return result[0];
    }
}
