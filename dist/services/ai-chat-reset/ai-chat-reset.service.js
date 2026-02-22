"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiChatResetService = void 0;
const adapters_1 = require("../../adapters");
const ai_chat_reset_class_1 = require("./ai-chat-reset.class");
const ai_chat_reset_hooks_1 = require("./ai-chat-reset.hooks");
exports.aiChatResetService = new ai_chat_reset_class_1.AiChatResetService(adapters_1.drizzleAdapter);
if (exports.aiChatResetService.hooks) {
    exports.aiChatResetService.hooks(ai_chat_reset_hooks_1.aiChatResetHooks);
}
