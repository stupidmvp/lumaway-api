import { drizzleAdapter } from '../../adapters';
import { UsersService } from './users.class';
import { usersHooks } from './users.hooks';

export const usersService = new UsersService(drizzleAdapter);

// Apply hooks
if ((usersService as any).hooks) {
    (usersService as any).hooks(usersHooks);
}
