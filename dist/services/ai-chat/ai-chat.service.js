"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiChatService = void 0;
const adapters_1 = require("../../adapters");
const ai_chat_class_1 = require("./ai-chat.class");
const ai_chat_hooks_1 = require("./ai-chat.hooks");
exports.aiChatService = new ai_chat_class_1.AiChatService(adapters_1.drizzleAdapter);
if (exports.aiChatService.hooks) {
    exports.aiChatService.hooks(ai_chat_hooks_1.aiChatHooks);
}
