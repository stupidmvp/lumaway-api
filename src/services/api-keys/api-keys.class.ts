import { DrizzleService, DrizzleAdapter } from '@flex-donec/core';
import { eq } from 'drizzle-orm';
import { apiKeys } from '../../db/schema';

export class ApiKeysService extends DrizzleService<typeof apiKeys> {
    constructor(storage: DrizzleAdapter, model: any, createSchema: any, patchSchema: any) {
        super(storage, model, createSchema, patchSchema);
    }

    /**
     * Override primary key column — api_keys uses `key` (text) instead of the default `id`.
     */
    getPrimaryKey() {
        return this.getColumn('key');
    }

    /**
     * Override get — base class hardcodes getColumn('id'), but our PK is `key`.
     */
    async get(id: string, params?: any) {
        const result = await (this as any).storage
            .select()
            .from(this.table)
            .where(eq(this.getColumn('key'), id))
            .limit(1);

        if (result.length === 0) {
            throw new Error(`API key not found`);
        }
        return result[0];
    }
}
