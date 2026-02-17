import { drizzleAdapter } from '../../adapters';
import { NotificationMarkReadService } from './notification-mark-read.class';
import { notificationMarkReadHooks } from './notification-mark-read.hooks';

export const notificationMarkReadService = new NotificationMarkReadService(drizzleAdapter);
(notificationMarkReadService as any).hooks(notificationMarkReadHooks);

