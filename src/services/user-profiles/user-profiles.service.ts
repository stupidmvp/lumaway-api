import { drizzleAdapter } from '../../adapters';
import { UserProfilesService } from './user-profiles.class';
import { userProfilesHooks } from './user-profiles.hooks';

export const userProfilesService = new UserProfilesService(drizzleAdapter);
(userProfilesService as any).hooks(userProfilesHooks);

