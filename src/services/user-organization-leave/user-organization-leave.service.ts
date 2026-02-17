import { drizzleAdapter } from '../../adapters';
import { UserOrganizationLeaveService } from './user-organization-leave.class';
import { userOrganizationLeaveHooks } from './user-organization-leave.hooks';

export const userOrganizationLeaveService = new UserOrganizationLeaveService(drizzleAdapter);
userOrganizationLeaveService.hooks(userOrganizationLeaveHooks);
