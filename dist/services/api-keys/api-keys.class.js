"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeysService = void 0;
const core_1 = require("@flex-donec/core");
const drizzle_orm_1 = require("drizzle-orm");
class ApiKeysService extends core_1.DrizzleService {
    constructor(storage, model, createSchema, patchSchema) {
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
    async get(id, params) {
        const result = await this.storage
            .select()
            .from(this.table)
            .where((0, drizzle_orm_1.eq)(this.getColumn('key'), id))
            .limit(1);
        if (result.length === 0) {
            throw new Error(`API key not found`);
        }
        return result[0];
    }
}
exports.ApiKeysService = ApiKeysService;
