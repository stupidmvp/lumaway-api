import { drizzleAdapter } from '../../adapters';
import { ProjectsService } from './projects.class';
import { projectsHooks } from './projects.hooks';
import { projects } from '../../db/schema';
import { projectsCreateSchema, projectsPatchSchema } from './projects.schema';

export const projectsService = new ProjectsService(drizzleAdapter, projects, projectsCreateSchema, projectsPatchSchema);

// Apply hooks
if ((projectsService as any).hooks) {
    (projectsService as any).hooks(projectsHooks);
}
