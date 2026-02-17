"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalkthroughParentCandidatesService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `walkthrough-parent-candidates` service — returns walkthroughs from the same project
 * that are valid parent candidates, excluding the walkthrough itself and all its descendants
 * to prevent circular references.
 *
 * - find(params) → GET /walkthrough-parent-candidates?walkthroughId=...&projectId=...&search=...
 *
 * The actual logic lives in `hooks/findParentCandidates.ts`.
 */
class WalkthroughParentCandidatesService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { return { data: [], total: 0 }; }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { throw new Error('Method not allowed'); }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.WalkthroughParentCandidatesService = WalkthroughParentCandidatesService;
