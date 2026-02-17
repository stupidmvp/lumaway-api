"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProjectData = void 0;
const validateProjectData = (context) => {
    const { data } = context;
    if (!data.organizationId) {
        throw new Error('Organization ID is required to create a project.');
    }
    return context;
};
exports.validateProjectData = validateProjectData;
