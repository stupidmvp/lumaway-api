import { authenticate } from '../../hooks/authenticate';
import { markAllRead } from './hooks/markAllRead';

export const notificationMarkReadHooks = {
    before: {
        all: [authenticate],
        create: [markAllRead],
    },
};
