"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meOrganizationService = void 0;
const adapters_1 = require("../../adapters");
const me_organization_class_1 = require("./me-organization.class");
const me_organization_hooks_1 = require("./me-organization.hooks");
exports.meOrganizationService = new me_organization_class_1.MeOrganizationService(adapters_1.drizzleAdapter);
exports.meOrganizationService.hooks(me_organization_hooks_1.meOrganizationHooks);
