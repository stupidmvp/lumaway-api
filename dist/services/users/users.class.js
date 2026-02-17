"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const core_1 = require("@flex-donec/core");
const schema_1 = require("../../db/schema");
const users_schema_1 = require("./users.schema");
class UsersService extends core_1.DrizzleService {
    constructor(storage) {
        super(storage, schema_1.users, users_schema_1.userCreateSchema, users_schema_1.userPatchSchema);
    }
}
exports.UsersService = UsersService;
