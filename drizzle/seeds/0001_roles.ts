import { drizzleAdapter } from '../../src/adapters';
import { roles } from '../../src/db/schema';

const db = (drizzleAdapter as any).db;

export async function seed(context: any) {
    console.log('🌱 Seeding roles...');

    const roleData = [
        { name: 'superadmin', description: 'Super Administrator - LumaWay Staff with absolute access' },
        { name: 'admin', description: 'Organization Administrator' },
        { name: 'editor', description: 'Content Editor - Can create and edit Projects and Walkthroughs' },
        { name: 'viewer', description: 'Read-only access to Dashboard' }
    ];

    const createdRoles = await db.insert(roles)
        .values(roleData)
        .onConflictDoUpdate({
            target: roles.name,
            set: { description: 'Updated by seed' }
        })
        .returning();

    const roleMap = createdRoles.reduce((acc: any, role: any) => {
        acc[role.name] = role;
        return acc;
    }, {});

    return { roles: roleMap };
}
