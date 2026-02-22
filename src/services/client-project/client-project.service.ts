import { drizzleAdapter } from '../../adapters';
import { ClientProjectService } from './client-project.class';
import { clientProjectHooks } from './client-project.hooks';

export const clientProjectService = new ClientProjectService(drizzleAdapter);

clientProjectService.hooks(clientProjectHooks);
