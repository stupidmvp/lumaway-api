import { z } from 'zod';

export const projectFavoritesCreateSchema = z.object({
    projectId: z.string().uuid(),
    userId: z.string().uuid(),
});

export const projectFavoritesPatchSchema = z.object({});

