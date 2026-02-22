"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiChatHooks = void 0;
const handleAiChat_1 = require("./hooks/handleAiChat");
// ai-chat uses API key auth (x-api-key header), not JWT — no standard authenticate hook
exports.aiChatHooks = {
    before: {
        all: [],
        create: [handleAiChat_1.handleAiChat],
    },
};
