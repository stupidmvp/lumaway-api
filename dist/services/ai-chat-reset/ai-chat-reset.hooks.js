"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiChatResetHooks = void 0;
const handleReset_1 = require("./hooks/handleReset");
exports.aiChatResetHooks = {
    before: {
        all: [],
        create: [handleReset_1.handleReset],
    },
};
