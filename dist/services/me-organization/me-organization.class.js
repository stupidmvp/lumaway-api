"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeOrganizationService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `me-organization` service — manages the active organization for the current user.
 *
 * - find(params)       → GET /me-organization        → returns the active org
 * - patch(id, data)    → PATCH /me-organization/:id  → updates the active org
 *
 * The actual logic lives in `hooks/findActiveOrganization.ts` and `hooks/patchActiveOrganization.ts`.
 */
class MeOrganizationService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) {
        return null;
    }
    async get(_id, _params) {
        return this.find(_params);
    }
    async create(_data, _params) {
        throw new Error('Method not allowed on me-organization service');
    }
    async patch(_id, _data, _params) {
        return {};
    }
    async remove(_id, _params) {
        throw new Error('Method not allowed on me-organization service');
    }
}
exports.MeOrganizationService = MeOrganizationService;
