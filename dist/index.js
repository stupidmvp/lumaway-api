"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@flex-donec/core");
const dotenv = __importStar(require("dotenv"));
const adapters_1 = require("./adapters");
const projects_service_1 = require("./services/projects/projects.service");
const walkthroughs_service_1 = require("./services/walkthroughs/walkthroughs.service");
const walkthrough_versions_service_1 = require("./services/walkthrough-versions/walkthrough-versions.service");
const organizations_service_1 = require("./services/organizations/organizations.service");
const api_keys_service_1 = require("./services/api-keys/api-keys.service");
const s3_url_signing_service_1 = require("./services/s3-url-signing/s3-url-signing.service");
const project_members_service_1 = require("./services/project-members/project-members.service");
const comments_service_1 = require("./services/comments/comments.service");
const project_invitations_service_1 = require("./services/project-invitations/project-invitations.service");
const notifications_service_1 = require("./services/notifications/notifications.service");
const LocalStrategy_1 = require("./strategies/LocalStrategy");
const JWTStrategy_1 = require("./strategies/JWTStrategy");
// RBAC Imports
const roles_service_1 = require("./services/roles/roles.service");
const permissions_service_1 = require("./services/permissions/permissions.service");
const modules_service_1 = require("./services/modules/modules.service");
const user_roles_service_1 = require("./services/user-roles/user-roles.service");
const role_permissions_service_1 = require("./services/role-permissions/role-permissions.service");
const users_service_1 = require("./services/users/users.service");
const withRolesHook_1 = require("./utils/withRolesHook");
const withPermissionsHook_1 = require("./utils/withPermissionsHook");
// Custom services (non-CRUD, extending BaseService)
const user_profiles_service_1 = require("./services/user-profiles/user-profiles.service");
const me_service_1 = require("./services/me/me.service");
const me_organizations_service_1 = require("./services/me-organizations/me-organizations.service");
const me_organization_service_1 = require("./services/me-organization/me-organization.service");
const user_organizations_service_1 = require("./services/user-organizations/user-organizations.service");
const user_organization_leave_service_1 = require("./services/user-organization-leave/user-organization-leave.service");
const org_members_service_1 = require("./services/org-members/org-members.service");
// Auth services
const auth_register_service_1 = require("./services/auth-register/auth-register.service");
const auth_onboarding_service_1 = require("./services/auth-onboarding/auth-onboarding.service");
const auth_onboarding_skip_service_1 = require("./services/auth-onboarding-skip/auth-onboarding-skip.service");
const auth_change_password_service_1 = require("./services/auth-change-password/auth-change-password.service");
const auth_forgot_password_service_1 = require("./services/auth-forgot-password/auth-forgot-password.service");
const auth_reset_password_service_1 = require("./services/auth-reset-password/auth-reset-password.service");
// Feature services
const project_settings_service_1 = require("./services/project-settings/project-settings.service");
const client_walkthroughs_service_1 = require("./services/client-walkthroughs/client-walkthroughs.service");
const invitation_details_service_1 = require("./services/invitation-details/invitation-details.service");
const invitation_accept_service_1 = require("./services/invitation-accept/invitation-accept.service");
const invitation_reject_service_1 = require("./services/invitation-reject/invitation-reject.service");
const notification_mark_read_service_1 = require("./services/notification-mark-read/notification-mark-read.service");
const walkthrough_restore_service_1 = require("./services/walkthrough-restore/walkthrough-restore.service");
// Admin services
const admin_users_service_1 = require("./services/admin-users/admin-users.service");
const admin_user_roles_service_1 = require("./services/admin-user-roles/admin-user-roles.service");
const admin_roles_service_1 = require("./services/admin-roles/admin-roles.service");
const admin_role_permissions_service_1 = require("./services/admin-role-permissions/admin-role-permissions.service");
const admin_permissions_service_1 = require("./services/admin-permissions/admin-permissions.service");
dotenv.config();
// Initialize App
const app = new core_1.FlexApp({
    db: adapters_1.drizzleAdapter,
    port: Number(process.env.PORT) || 3001,
});
// Configure Auth
const jwtSecret = process.env.JWT_SECRET || 'default-secret';
app.configureAuth({
    secret: jwtSecret,
});
// Register Strategies with Hooks
const localStrategy = new LocalStrategy_1.LocalStrategy(adapters_1.drizzleAdapter, jwtSecret);
const jwtStrategy = new JWTStrategy_1.JWTStrategy(adapters_1.drizzleAdapter, jwtSecret);
const localStrategyWithRBAC = (0, withPermissionsHook_1.withPermissionsHook)((0, withRolesHook_1.withRolesHook)(localStrategy, adapters_1.drizzleAdapter), adapters_1.drizzleAdapter);
const jwtStrategyWithRBAC = (0, withPermissionsHook_1.withPermissionsHook)((0, withRolesHook_1.withRolesHook)(jwtStrategy, adapters_1.drizzleAdapter), adapters_1.drizzleAdapter);
const authService = app.getAuthenticationService();
if (authService) {
    authService.registerStrategy(localStrategyWithRBAC);
    authService.registerStrategy(jwtStrategyWithRBAC);
}
// =====================================================
// Register DrizzleService-based services (standard CRUD)
// =====================================================
app.registerService('projects', projects_service_1.projectsService);
app.registerService('walkthroughs', walkthroughs_service_1.walkthroughsService);
app.registerService('walkthrough-versions', walkthrough_versions_service_1.walkthroughVersionsService);
// RBAC Services
app.registerService('users', users_service_1.usersService);
app.registerService('roles', roles_service_1.rolesService);
app.registerService('permissions', permissions_service_1.permissionsService);
app.registerService('modules', modules_service_1.modulesService);
app.registerService('user-roles', user_roles_service_1.userRolesService);
app.registerService('role-permissions', role_permissions_service_1.rolePermissionsService);
app.registerService('organizations', organizations_service_1.organizationsService);
app.registerService('api-keys', api_keys_service_1.apiKeysService);
app.registerService('s3-url-signing', s3_url_signing_service_1.s3UrlSigningService);
app.registerService('project-members', project_members_service_1.projectMembersService);
app.registerService('comments', comments_service_1.commentsService);
app.registerService('project-invitations', project_invitations_service_1.projectInvitationsService);
app.registerService('notifications', notifications_service_1.notificationsService);
// =====================================================
// Register custom BaseService services
// =====================================================
// User profiles
app.registerService('user-profiles', user_profiles_service_1.userProfilesService);
app.registerService('me', me_service_1.meService);
app.registerService('me-organizations', me_organizations_service_1.meOrganizationsService);
app.registerService('me-organization', me_organization_service_1.meOrganizationService);
app.registerService('user-organizations', user_organizations_service_1.userOrganizationsService);
app.registerService('user-organization-leave', user_organization_leave_service_1.userOrganizationLeaveService);
app.registerService('org-members', org_members_service_1.orgMembersService);
// Auth
app.registerService('auth-register', auth_register_service_1.authRegisterService);
app.registerService('auth-onboarding', auth_onboarding_service_1.authOnboardingService);
app.registerService('auth-onboarding-skip', auth_onboarding_skip_service_1.authOnboardingSkipService);
app.registerService('auth-change-password', auth_change_password_service_1.authChangePasswordService);
app.registerService('auth-forgot-password', auth_forgot_password_service_1.authForgotPasswordService);
app.registerService('auth-reset-password', auth_reset_password_service_1.authResetPasswordService);
// Features
app.registerService('project-settings', project_settings_service_1.projectSettingsService);
app.registerService('client-walkthroughs', client_walkthroughs_service_1.clientWalkthroughsService);
app.registerService('invitation-details', invitation_details_service_1.invitationDetailsService);
app.registerService('invitation-accept', invitation_accept_service_1.invitationAcceptService);
app.registerService('invitation-reject', invitation_reject_service_1.invitationRejectService);
app.registerService('notification-mark-read', notification_mark_read_service_1.notificationMarkReadService);
// Walkthrough restore needs app reference to call other services
walkthrough_restore_service_1.walkthroughRestoreService.setApp(app);
app.registerService('walkthrough-restore', walkthrough_restore_service_1.walkthroughRestoreService);
// Admin (superadmin only)
app.registerService('admin-users', admin_users_service_1.adminUsersService);
app.registerService('admin-user-roles', admin_user_roles_service_1.adminUserRolesService);
app.registerService('admin-roles', admin_roles_service_1.adminRolesService);
app.registerService('admin-role-permissions', admin_role_permissions_service_1.adminRolePermissionsService);
app.registerService('admin-permissions', admin_permissions_service_1.adminPermissionsService);
// Start Server
app.listen().then(() => {
    console.log(`🚀 LumaWay API (Flex + Auth) running on port ${process.env.PORT || 3001}`);
});
