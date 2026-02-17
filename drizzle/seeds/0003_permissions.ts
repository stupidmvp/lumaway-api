import { drizzleAdapter } from '../../src/adapters';
import { modules, permissions } from '../../src/db/schema';

const db = (drizzleAdapter as any).db;

export async function seed(context: any = {}) {
    console.log('🛡️ Seeding modules and permissions...');

    const scopes = ['all', 'organization', 'own']; // Scopes: Global, Organization-wide, Own-only

    // 1. Projects
    const [projectsModule] = await db.insert(modules).values({ name: 'Projects', key: 'projects', status: 'active' }).onConflictDoNothing().returning();
    if (projectsModule) {
        const actions = ['read', 'create', 'update', 'delete'];
        for (const action of actions) {
            for (const scope of scopes) {
                await db.insert(permissions).values({
                    moduleId: projectsModule.id,
                    name: `projects:${action}:${scope}`,
                    description: `${action} projects (${scope})`
                }).onConflictDoNothing();
            }
        }
    }

    // 2. Walkthroughs
    const [walkthroughsModule] = await db.insert(modules).values({ name: 'Walkthroughs', key: 'walkthroughs', status: 'active' }).onConflictDoNothing().returning();
    if (walkthroughsModule) {
        const actions = ['read', 'create', 'update', 'delete', 'publish'];
        for (const action of actions) {
            for (const scope of scopes) {
                await db.insert(permissions).values({
                    moduleId: walkthroughsModule.id,
                    name: `walkthroughs:${action}:${scope}`,
                    description: `${action} walkthroughs (${scope})`
                }).onConflictDoNothing();
            }
        }
    }

    // 3. Users (Team Management)
    const [usersModule] = await db.insert(modules).values({ name: 'Users', key: 'users', status: 'active' }).onConflictDoNothing().returning();
    if (usersModule) {
        const actions = ['read', 'create', 'update', 'delete', 'invite'];
        for (const action of actions) {
            for (const scope of scopes) {
                await db.insert(permissions).values({
                    moduleId: usersModule.id,
                    name: `users:${action}:${scope}`,
                    description: `${action} users (${scope})`
                }).onConflictDoNothing();
            }
        }
    }

    // 4. API Keys
    const [apiKeysModule] = await db.insert(modules).values({ name: 'API Keys', key: 'api-keys', status: 'active' }).onConflictDoNothing().returning();
    if (apiKeysModule) {
        const actions = ['read', 'create', 'revoke'];
        for (const action of actions) {
            for (const scope of scopes) {
                await db.insert(permissions).values({
                    moduleId: apiKeysModule.id,
                    name: `api-keys:${action}:${scope}`,
                    description: `${action} api keys (${scope})`
                }).onConflictDoNothing();
            }
        }
    }

    // 5. Organizations (Settings)
    const [orgModule] = await db.insert(modules).values({ name: 'Organizations', key: 'organizations', status: 'active' }).onConflictDoNothing().returning();
    if (orgModule) {
        const actions = ['read', 'update'];
        for (const action of actions) {
            for (const scope of scopes) {
                await db.insert(permissions).values({
                    moduleId: orgModule.id,
                    name: `organizations:${action}:${scope}`,
                    description: `${action} organization (${scope})`
                }).onConflictDoNothing();
            }
        }
    }

    console.log('   -> Modules & Permissions created.');
    return { projectsModule, walkthroughsModule };
}
