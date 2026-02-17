"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeysHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const generateKey_1 = require("./hooks/generateKey");
const populateProject_1 = require("./hooks/populateProject");
exports.apiKeysHooks = {
    before: {
        create: [authenticate_1.authenticate, generateKey_1.generateKey],
        update: [authenticate_1.authenticate],
        patch: [authenticate_1.authenticate],
        remove: [authenticate_1.authenticate]
    },
    after: {
        all: [populateProject_1.populateProject]
    }
};
