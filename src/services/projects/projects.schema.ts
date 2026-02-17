import { z } from 'zod';
import { projects } from '../../db/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { projectSettingsSchema } from './projects.settings-schema';

export const projectsSchema = createSelectSchema(projects);

export const projectsCreateSchema = createInsertSchema(projects, {
    organizationId: z.string().uuid().optional(), // Populated by hook
    ownerId: z.string().uuid().optional(),        // Populated by hook
    settings: projectSettingsSchema.optional(),
}).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const projectsPatchSchema = createInsertSchema(projects, {
    settings: projectSettingsSchema.optional(),
}).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    organizationId: true, // Should not change org usually
}).partial();
