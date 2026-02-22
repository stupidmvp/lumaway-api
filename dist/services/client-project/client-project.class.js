"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientProjectService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `client-project` service — public API-key-authenticated endpoint for fetching
 * project configuration (branding, assistant settings).
 *
 * - find(params) → GET /client-project (requires x-api-key header)
 */
class ClientProjectService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { return {}; }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { throw new Error('Method not allowed'); }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.ClientProjectService = ClientProjectService;
