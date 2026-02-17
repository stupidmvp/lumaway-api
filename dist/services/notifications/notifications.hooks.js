"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsHooks = void 0;
const authenticate_1 = require("../../hooks/authenticate");
const restrictToOwner_1 = require("./hooks/restrictToOwner");
const castQuery_1 = require("../../hooks/castQuery");
exports.notificationsHooks = {
    before: {
        all: [authenticate_1.authenticate],
        find: [
            (0, castQuery_1.castQuery)({ booleans: ['read'] }),
            restrictToOwner_1.restrictToOwner,
        ],
        get: [],
        create: [], // Created internally by the system, not by users
        patch: [restrictToOwner_1.restrictToOwner],
        remove: [restrictToOwner_1.restrictToOwner],
    },
    after: {},
};
