"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meOrganizationsService = void 0;
const adapters_1 = require("../../adapters");
const me_organizations_class_1 = require("./me-organizations.class");
const me_organizations_hooks_1 = require("./me-organizations.hooks");
exports.meOrganizationsService = new me_organizations_class_1.MeOrganizationsService(adapters_1.drizzleAdapter);
exports.meOrganizationsService.hooks(me_organizations_hooks_1.meOrganizationsHooks);
