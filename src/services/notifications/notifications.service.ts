import { drizzleAdapter } from '../../adapters';
import { NotificationsService } from './notifications.class';
import { notificationsHooks } from './notifications.hooks';
import { notifications } from '../../db/schema';
import { notificationsCreateSchema, notificationsPatchSchema } from './notifications.schema';

export const notificationsService = new NotificationsService(
    drizzleAdapter,
    notifications,
    notificationsCreateSchema,
    notificationsPatchSchema
);

// Apply hooks
if ((notificationsService as any).hooks) {
    (notificationsService as any).hooks(notificationsHooks);
}


