"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalkthroughVersionsService = void 0;
const core_1 = require("@flex-donec/core");
class WalkthroughVersionsService extends core_1.DrizzleService {
    constructor(storage, model, createSchema, patchSchema) {
        super(storage, model, createSchema, patchSchema);
    }
}
exports.WalkthroughVersionsService = WalkthroughVersionsService;
