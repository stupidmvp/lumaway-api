import { drizzleAdapter } from '../../adapters';
import { OrgMembersService } from './org-members.class';
import { orgMembersHooks } from './org-members.hooks';

export const orgMembersService = new OrgMembersService(drizzleAdapter);
orgMembersService.hooks(orgMembersHooks);
