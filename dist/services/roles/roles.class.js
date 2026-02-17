"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const core_1 = require("@flex-donec/core");
const schema_1 = require("../../db/schema");
const roles_schema_1 = require("./roles.schema");
class RolesService extends core_1.DrizzleService {
    constructor(storage) {
        super(storage, schema_1.roles, roles_schema_1.rolesCreateSchema, roles_schema_1.rolesPatchSchema);
    }
}
exports.RolesService = RolesService;
