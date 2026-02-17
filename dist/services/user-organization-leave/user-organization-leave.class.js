"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserOrganizationLeaveService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `user-organization-leave` service — allows a user to leave an organization.
 *
 * - create({ organizationId }) → POST /user-organization-leave → leave an org
 *
 * The actual logic lives in `hooks/leaveOrganization.ts`.
 */
class UserOrganizationLeaveService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) {
        throw new Error('Method not allowed on user-organization-leave service');
    }
    async get(_id, _params) {
        throw new Error('Method not allowed on user-organization-leave service');
    }
    async create(_data, _params) {
        return {};
    }
    async patch(_id, _data, _params) {
        throw new Error('Method not allowed on user-organization-leave service');
    }
    async remove(_id, _params) {
        throw new Error('Method not allowed on user-organization-leave service');
    }
}
exports.UserOrganizationLeaveService = UserOrganizationLeaveService;
