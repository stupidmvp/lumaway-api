import { drizzleAdapter } from '../../adapters';
import { ProjectMembersService } from './project-members.class';
import { projectMembersHooks } from './project-members.hooks';
import { projectMembers } from '../../db/schema';
import { projectMembersCreateSchema, projectMembersPatchSchema } from './project-members.schema';

export const projectMembersService = new ProjectMembersService(
    drizzleAdapter,
    projectMembers,
    projectMembersCreateSchema,
    projectMembersPatchSchema
);

// Apply hooks
if ((projectMembersService as any).hooks) {
    (projectMembersService as any).hooks(projectMembersHooks);
}


