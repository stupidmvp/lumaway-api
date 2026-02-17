"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWalkthroughRestoreHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const restoreWalkthrough_1 = require("./hooks/restoreWalkthrough");
const injectApp_1 = require("./hooks/injectApp");
/**
 * Creates hooks for the walkthrough-restore service.
 * Needs the service instance to inject the app reference.
 */
const createWalkthroughRestoreHooks = (service) => ({
    before: {
        all: [authenticate_1.authenticate],
        create: [(0, injectApp_1.injectApp)(service), restoreWalkthrough_1.restoreWalkthrough],
    },
});
exports.createWalkthroughRestoreHooks = createWalkthroughRestoreHooks;
