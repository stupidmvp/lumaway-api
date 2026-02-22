"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiChatResetService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `ai-chat-reset` service — POST /ai-chat-reset
 *
 * Clears conversation history for a project.
 * Useful when user wants to start fresh or context becomes stale.
 */
class AiChatResetService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { return {}; }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.AiChatResetService = AiChatResetService;
