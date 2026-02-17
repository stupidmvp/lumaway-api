"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientWalkthroughsService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `client-walkthroughs` service — public API-key-authenticated endpoint for fetching
 * published walkthroughs for a project.
 *
 * - find(params) → GET /client-walkthroughs (requires x-api-key header)
 *
 * The actual logic lives in `hooks/findPublishedWalkthroughs.ts`.
 */
class ClientWalkthroughsService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { return []; }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { throw new Error('Method not allowed'); }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.ClientWalkthroughsService = ClientWalkthroughsService;
