"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModulesService = void 0;
const core_1 = require("@flex-donec/core");
const schema_1 = require("../../db/schema");
const modules_schema_1 = require("./modules.schema");
class ModulesService extends core_1.DrizzleService {
    constructor(storage) {
        super(storage, schema_1.modules, modules_schema_1.modulesCreateSchema, modules_schema_1.modulesPatchSchema);
    }
}
exports.ModulesService = ModulesService;
