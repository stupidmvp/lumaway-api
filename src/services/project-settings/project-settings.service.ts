import { drizzleAdapter } from '../../adapters';
import { ProjectSettingsService } from './project-settings.class';
import { projectSettingsHooks } from './project-settings.hooks';

export const projectSettingsService = new ProjectSettingsService(drizzleAdapter);
(projectSettingsService as any).hooks(projectSettingsHooks);

