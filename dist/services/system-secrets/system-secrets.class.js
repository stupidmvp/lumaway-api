"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSecretsService = void 0;
const core_1 = require("@flex-donec/core");
class SystemSecretsService extends core_1.DrizzleService {
    constructor(storage, model, createSchema, patchSchema) {
        super(storage, model, createSchema, patchSchema);
    }
}
exports.SystemSecretsService = SystemSecretsService;
