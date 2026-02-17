import { drizzleAdapter } from '../../adapters';
import { ProjectInvitationsService } from './project-invitations.class';
import { projectInvitationsHooks } from './project-invitations.hooks';
import { projectInvitations } from '../../db/schema';
import { projectInvitationsCreateSchema, projectInvitationsPatchSchema } from './project-invitations.schema';

export const projectInvitationsService = new ProjectInvitationsService(
    drizzleAdapter,
    projectInvitations,
    projectInvitationsCreateSchema,
    projectInvitationsPatchSchema
);

// Apply hooks
if ((projectInvitationsService as any).hooks) {
    (projectInvitationsService as any).hooks(projectInvitationsHooks);
}


