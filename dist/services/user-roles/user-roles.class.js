"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRolesService = void 0;
const core_1 = require("@flex-donec/core");
const schema_1 = require("../../db/schema");
const user_roles_schema_1 = require("./user-roles.schema");
class UserRolesService extends core_1.DrizzleService {
    constructor(storage) {
        super(storage, schema_1.userRoles, user_roles_schema_1.userRolesCreateSchema, user_roles_schema_1.userRolesPatchSchema);
    }
}
exports.UserRolesService = UserRolesService;
