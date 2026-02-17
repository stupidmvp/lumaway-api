import { FlexApp } from '@flex-donec/core';
import * as dotenv from 'dotenv';
import { drizzleAdapter } from './adapters';
import { projectsService } from './services/projects/projects.service';
import { walkthroughsService } from './services/walkthroughs/walkthroughs.service';
import { walkthroughVersionsService } from './services/walkthrough-versions/walkthrough-versions.service';
import { organizationsService } from './services/organizations/organizations.service';
import { apiKeysService } from './services/api-keys/api-keys.service';
import { s3UrlSigningService } from './services/s3-url-signing/s3-url-signing.service';
import { projectMembersService } from './services/project-members/project-members.service';
import { commentsService } from './services/comments/comments.service';
import { projectInvitationsService } from './services/project-invitations/project-invitations.service';
import { notificationsService } from './services/notifications/notifications.service';
import { LocalStrategy } from './strategies/LocalStrategy';
import { JWTStrategy } from './strategies/JWTStrategy';

// RBAC Imports
import { rolesService } from './services/roles/roles.service';
import { permissionsService } from './services/permissions/permissions.service';
import { modulesService } from './services/modules/modules.service';
import { userRolesService } from './services/user-roles/user-roles.service';
import { rolePermissionsService } from './services/role-permissions/role-permissions.service';
import { usersService } from './services/users/users.service';
import { withRolesHook } from './utils/withRolesHook';
import { withPermissionsHook } from './utils/withPermissionsHook';

// Custom services (non-CRUD, extending BaseService)
import { userProfilesService } from './services/user-profiles/user-profiles.service';
import { meService } from './services/me/me.service';
import { meOrganizationsService } from './services/me-organizations/me-organizations.service';
import { meOrganizationService } from './services/me-organization/me-organization.service';
import { userOrganizationsService } from './services/user-organizations/user-organizations.service';
import { userOrganizationLeaveService } from './services/user-organization-leave/user-organization-leave.service';
import { orgMembersService } from './services/org-members/org-members.service';

// Auth services
import { authRegisterService } from './services/auth-register/auth-register.service';
import { authOnboardingService } from './services/auth-onboarding/auth-onboarding.service';
import { authOnboardingSkipService } from './services/auth-onboarding-skip/auth-onboarding-skip.service';
import { authChangePasswordService } from './services/auth-change-password/auth-change-password.service';
import { authForgotPasswordService } from './services/auth-forgot-password/auth-forgot-password.service';
import { authResetPasswordService } from './services/auth-reset-password/auth-reset-password.service';

// Feature services
import { projectSettingsService } from './services/project-settings/project-settings.service';
import { clientWalkthroughsService } from './services/client-walkthroughs/client-walkthroughs.service';
import { invitationDetailsService } from './services/invitation-details/invitation-details.service';
import { invitationAcceptService } from './services/invitation-accept/invitation-accept.service';
import { invitationRejectService } from './services/invitation-reject/invitation-reject.service';
import { notificationMarkReadService } from './services/notification-mark-read/notification-mark-read.service';
import { walkthroughRestoreService } from './services/walkthrough-restore/walkthrough-restore.service';
import { walkthroughParentCandidatesService } from './services/walkthrough-parent-candidates/walkthrough-parent-candidates.service';
import { actorsService } from './services/actors/actors.service';
import { walkthroughActorsService } from './services/walkthrough-actors/walkthrough-actors.service';
import { commentReactionsService } from './services/comment-reactions/comment-reactions.service';
import { projectFavoritesService } from './services/project-favorites/project-favorites.service';

// Admin services
import { adminUsersService } from './services/admin-users/admin-users.service';
import { adminUserRolesService } from './services/admin-user-roles/admin-user-roles.service';
import { adminRolesService } from './services/admin-roles/admin-roles.service';
import { adminRolePermissionsService } from './services/admin-role-permissions/admin-role-permissions.service';
import { adminPermissionsService } from './services/admin-permissions/admin-permissions.service';

dotenv.config();

// Initialize App
const app = new FlexApp({
    db: drizzleAdapter,
    port: Number(process.env.PORT) || 3001,
    host: '0.0.0.0',
    cors: {
        origin: ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            // Log for every preflight/request to see what the browser sends
            console.log(`[CORS Check] Origin: ${origin}`);

            // Allow all for now during debugging but reflecting to avoid standard '*' issues with credentials
            // This is effectively "origin: true" but with manual logging
            return callback(null, true);
        }) as any,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-api-key'],
        exposedHeaders: ['Authorization'], // Critical for some clients to "see" the token
    } as any,
});

// Middleware for deep authentication diagnostics
app.use((req, res, next) => {
    const oldSend = res.send;
    res.send = function (data) {
        if (res.statusCode === 401) {
            const authHeader = req.headers.authorization || '';
            const tokenSnippet = authHeader.startsWith('Bearer ')
                ? `${authHeader.substring(0, 15)}...${authHeader.substring(authHeader.length - 5)}`
                : 'NONE';

            console.log(`[401 Diagnostic]`);
            console.log(`  Path: ${req.method} ${req.path}`);
            console.log(`  Origin: ${req.headers.origin}`);
            console.log(`  Auth Header: ${tokenSnippet} (Total length: ${authHeader.length})`);
            console.log(`  JWT_SECRET present: ${process.env.JWT_SECRET ? 'YES' : 'NO'}`);
        }
        return oldSend.apply(res, arguments as any);
    };
    next();
});

// Configure Auth
const jwtSecret = process.env.JWT_SECRET || 'default-secret';
app.configureAuth({
    secret: jwtSecret,
});

// Register Strategies with Hooks
const localStrategy = new LocalStrategy(drizzleAdapter, jwtSecret);
const jwtStrategy = new JWTStrategy(drizzleAdapter, jwtSecret);

const localStrategyWithRBAC = withPermissionsHook(
    withRolesHook(localStrategy, drizzleAdapter),
    drizzleAdapter
);

const jwtStrategyWithRBAC = withPermissionsHook(
    withRolesHook(jwtStrategy, drizzleAdapter),
    drizzleAdapter
);

const authService = app.getAuthenticationService();
if (authService) {
    authService.registerStrategy(localStrategyWithRBAC);
    authService.registerStrategy(jwtStrategyWithRBAC);
}

// =====================================================
// Register DrizzleService-based services (standard CRUD)
// =====================================================
app.registerService('projects', projectsService);
app.registerService('walkthroughs', walkthroughsService);
app.registerService('walkthrough-versions', walkthroughVersionsService);

// RBAC Services
app.registerService('users', usersService);
app.registerService('roles', rolesService);
app.registerService('permissions', permissionsService);
app.registerService('modules', modulesService);
app.registerService('user-roles', userRolesService);
app.registerService('role-permissions', rolePermissionsService);
app.registerService('organizations', organizationsService);
app.registerService('api-keys', apiKeysService);
app.registerService('s3-url-signing', s3UrlSigningService);
app.registerService('project-members', projectMembersService);
app.registerService('comments', commentsService);
app.registerService('comment-reactions', commentReactionsService);
app.registerService('project-invitations', projectInvitationsService);
app.registerService('project-favorites', projectFavoritesService);
app.registerService('notifications', notificationsService);

// =====================================================
// Register custom BaseService services
// =====================================================

// User profiles
app.registerService('user-profiles', userProfilesService);
app.registerService('me', meService);
app.registerService('me-organizations', meOrganizationsService);
app.registerService('me-organization', meOrganizationService);
app.registerService('user-organizations', userOrganizationsService);
app.registerService('user-organization-leave', userOrganizationLeaveService);
app.registerService('org-members', orgMembersService);

// Auth
app.registerService('auth-register', authRegisterService);
app.registerService('auth-onboarding', authOnboardingService);
app.registerService('auth-onboarding-skip', authOnboardingSkipService);
app.registerService('auth-change-password', authChangePasswordService);
app.registerService('auth-forgot-password', authForgotPasswordService);
app.registerService('auth-reset-password', authResetPasswordService);

// Features
app.registerService('project-settings', projectSettingsService);
app.registerService('client-walkthroughs', clientWalkthroughsService);
app.registerService('invitation-details', invitationDetailsService);
app.registerService('invitation-accept', invitationAcceptService);
app.registerService('invitation-reject', invitationRejectService);
app.registerService('notification-mark-read', notificationMarkReadService);

// Actors & walkthrough-actors
app.registerService('actors', actorsService);
app.registerService('walkthrough-actors', walkthroughActorsService);

// Walkthrough restore needs app reference to call other services
(walkthroughRestoreService as any).setApp(app);
app.registerService('walkthrough-restore', walkthroughRestoreService);
app.registerService('walkthrough-parent-candidates', walkthroughParentCandidatesService);

// Admin (superadmin only)
app.registerService('admin-users', adminUsersService);
app.registerService('admin-user-roles', adminUserRolesService);
app.registerService('admin-roles', adminRolesService);
app.registerService('admin-role-permissions', adminRolePermissionsService);
app.registerService('admin-permissions', adminPermissionsService);

// Start Server
app.listen().then(() => {
    console.log(`🚀 LumaWay API (Flex + Auth) running on port ${process.env.PORT || 3001}`);
});
