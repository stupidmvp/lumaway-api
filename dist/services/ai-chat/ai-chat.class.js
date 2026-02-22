"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiChatService = void 0;
const core_1 = require("@flex-donec/core");
/**
 * `ai-chat` service — POST /ai-chat
 *
 * Receives a user message + projectId, resolves the correct LLM
 * based on org subscription, and responds with AI-generated text
 * using walkthrough context from the project.
 *
 * Logic lives in `hooks/handleAiChat.ts`.
 */
class AiChatService extends core_1.BaseService {
    constructor(storage) {
        super(storage);
    }
    async find(_params) { throw new Error('Method not allowed'); }
    async get(_id, _params) { throw new Error('Method not allowed'); }
    async create(_data, _params) { return {}; }
    async patch(_id, _data, _params) { throw new Error('Method not allowed'); }
    async remove(_id, _params) { throw new Error('Method not allowed'); }
}
exports.AiChatService = AiChatService;
