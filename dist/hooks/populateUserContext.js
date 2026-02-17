"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateUserContext = void 0;
const adapters_1 = require("../adapters");
const organizationMemberships_1 = require("../utils/organizationMemberships");
/**
 * Populates the request data with the authenticated user's context.
 *
 * - Sets ownerId to the current user
 * - Sets organizationId based on:
 *   1. Explicit value from the request data (if provided)
 *   2. The user's legacy organizationId field
 *   3. The first org where user is owner/admin (from organization_members)
 *
 * This ensures backward compatibility while supporting the new multi-org model.
 */
const populateUserContext = async (context) => {
    const { params, data } = context;
    const user = params?.user;
    if (user && data) {
        // Set ownerId to current user if not already set
        if (!data.ownerId) {
            data.ownerId = user.id;
        }
        // Set organizationId if not already provided in the request
        if (!data.organizationId) {
            // 1. Prefer the active org sent by the frontend via header
            const activeOrgId = context.params?.headers?.['x-organization-id'];
            if (activeOrgId) {
                data.organizationId = activeOrgId;
            }
            // 2. Legacy direct FK on user record
            else if (user.organizationId) {
                data.organizationId = user.organizationId;
            }
            // 3. Resolve from organization_members — pick the first org where user has owner/admin role
            else {
                const memberships = await (0, organizationMemberships_1.getUserOrgMemberships)(adapters_1.drizzleAdapter, user.id);
                const primaryOrg = memberships.find(m => m.role === 'owner' || m.role === 'admin');
                if (primaryOrg) {
                    data.organizationId = primaryOrg.organizationId;
                }
            }
        }
    }
    return context;
};
exports.populateUserContext = populateUserContext;
