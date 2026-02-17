"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectFavoritesHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const castQuery_1 = require("../../hooks/castQuery");
const setCurrentUser_1 = require("./hooks/setCurrentUser");
const filterByCurrentUser_1 = require("./hooks/filterByCurrentUser");
exports.projectFavoritesHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [
            (0, castQuery_1.castQuery)({}),
            filterByCurrentUser_1.filterByCurrentUser,
        ],
        get: [],
        create: [setCurrentUser_1.setCurrentUser],
        patch: [],
        remove: [],
    },
    after: {
        all: [],
    },
};
