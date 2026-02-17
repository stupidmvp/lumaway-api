"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsService = void 0;
const core_1 = require("@flex-donec/core");
const schema_1 = require("../../db/schema");
const permissions_schema_1 = require("./permissions.schema");
class PermissionsService extends core_1.DrizzleService {
    constructor(storage) {
        super(storage, schema_1.permissions, permissions_schema_1.permissionsCreateSchema, permissions_schema_1.permissionsPatchSchema);
    }
}
exports.PermissionsService = PermissionsService;
