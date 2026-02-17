"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserOrganizationsService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `user-organizations` service — create and delete organizations.
 *
 * - create(data)  → POST /user-organizations       → creates a new org + owner membership
 * - remove(id)    → DELETE /user-organizations/:id  → deletes an org (owner or superadmin)
 *
 * The actual logic lives in `hooks/createOrganization.ts` and `hooks/removeOrganization.ts`.
 */
class UserOrganizationsService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) {
        throw new Error('Method not allowed on user-organizations service');
    }
    async get(_id, _params) {
        throw new Error('Method not allowed on user-organizations service');
    }
    async create(_data, _params) {
        return {};
    }
    async patch(_id, _data, _params) {
        throw new Error('Method not allowed on user-organizations service');
    }
    async remove(_id, _params) {
        return {};
    }
}
exports.UserOrganizationsService = UserOrganizationsService;
