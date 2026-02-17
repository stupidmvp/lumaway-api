import { BaseService, DrizzleAdapter } from '@flex-donec/core';

/**
 * `walkthrough-parent-candidates` service — returns walkthroughs from the same project
 * that are valid parent candidates, excluding the walkthrough itself and all its descendants
 * to prevent circular references.
 *
 * - find(params) → GET /walkthrough-parent-candidates?walkthroughId=...&projectId=...&search=...
 *
 * The actual logic lives in `hooks/findParentCandidates.ts`.
 */
export class WalkthroughParentCandidatesService extends BaseService<any> {
    constructor(storage: DrizzleAdapter) {
        super(storage);
    }

    async find(_params?: any): Promise<any> { return { data: [], total: 0 }; }
    async get(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async create(_data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async patch(_id: string, _data: any, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
    async remove(_id: string, _params?: any): Promise<any> { throw new Error('Method not allowed'); }
}

