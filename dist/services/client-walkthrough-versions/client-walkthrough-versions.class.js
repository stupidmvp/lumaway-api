"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientWalkthroughVersionsService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `client-walkthrough-versions` service — public API-key-authenticated endpoint
 * for fetching version history for a specific walkthrough.
 *
 * - find(params) → GET /client-walkthrough-versions?walkthroughId=... (requires x-api-key)
 */
class ClientWalkthroughVersionsService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { return []; }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { throw new Error('Method not allowed'); }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.ClientWalkthroughVersionsService = ClientWalkthroughVersionsService;
