"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationMarkReadHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const markAllRead_1 = require("./hooks/markAllRead");
exports.notificationMarkReadHooks = {
    before: {
        all: [authenticate_1.authenticate],
        create: [markAllRead_1.markAllRead],
    },
};
