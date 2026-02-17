"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationsService = void 0;
const adapters_1 = require("../../adapters");
const organizations_class_1 = require("./organizations.class");
exports.organizationsService = new organizations_class_1.OrganizationsService(adapters_1.drizzleAdapter);
