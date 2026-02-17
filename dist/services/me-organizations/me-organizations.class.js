"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeOrganizationsService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `me-organizations` service — lists all organizations the current user belongs to.
 *
 * - find(params) → GET /me-organizations → returns the user's organization memberships
 *
 * Superadmin users see ALL organizations in the system.
 *
 * The actual find logic lives in `hooks/findUserOrganizations.ts` (before.find hook).
 */
class MeOrganizationsService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) {
        return { data: [], total: 0 };
    }
    async get(_id, _params) {
        throw new Error('Method not allowed on me-organizations service');
    }
    async create(_data, _params) {
        throw new Error('Method not allowed on me-organizations service');
    }
    async patch(_id, _data, _params) {
        throw new Error('Method not allowed on me-organizations service');
    }
    async remove(_id, _params) {
        throw new Error('Method not allowed on me-organizations service');
    }
}
exports.MeOrganizationsService = MeOrganizationsService;
