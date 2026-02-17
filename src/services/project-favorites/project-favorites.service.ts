import { drizzleAdapter } from '../../adapters';
import { ProjectFavoritesService } from './project-favorites.class';
import { projectFavoritesHooks } from './project-favorites.hooks';
import { projectFavorites } from '../../db/schema';
import { projectFavoritesCreateSchema, projectFavoritesPatchSchema } from './project-favorites.schema';

export const projectFavoritesService = new ProjectFavoritesService(
    drizzleAdapter,
    projectFavorites,
    projectFavoritesCreateSchema,
    projectFavoritesPatchSchema
);

// Apply hooks
if ((projectFavoritesService as any).hooks) {
    (projectFavoritesService as any).hooks(projectFavoritesHooks);
}

