"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const search_1 = require("../../hooks/search");
const castQuery_1 = require("../../hooks/castQuery");
exports.usersHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [
            (0, castQuery_1.castQuery)({}),
            (0, search_1.search)({ fields: ['email'] }),
        ],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },
    after: {
        all: [],
    },
};
