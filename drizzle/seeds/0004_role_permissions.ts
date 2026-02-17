import { drizzleAdapter } from '../../src/adapters';
import { rolePermissions, permissions } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

const db = (drizzleAdapter as any).db;

export async function seed(context: any) {
    console.log('🔑 Assigning permissions to roles...');
    const { roles } = context;

    if (!roles) {
        console.warn('   ! Skipping role assignment: Roles not found in context.');
        return;
    }

    const adminRole = roles['admin'];
    const editorRole = roles['editor'];
    const viewerRole = roles['viewer'];

    // Fetch all permissions
    const allPermissions = await db.select().from(permissions);

    // 1. Admin (Organization Admin)
    // Grants access to everything within their 'organization' scope
    if (adminRole) {
        const adminPerms = allPermissions.filter((p: any) => p.name.endsWith(':organization'));

        for (const p of adminPerms) {
            await db.insert(rolePermissions).values({
                roleId: adminRole.id,
                permissionId: p.id
            }).onConflictDoNothing();
        }
        console.log('   -> Admin granted organization-wide permissions.');
    }

    // 2. Editor (Content Creator)
    // Grants access to Projects and Walkthroughs (organization scope) but maybe restricted user management?
    // For simplicity MVP: Editor can manage content (Projects, Walkthroughs) but not Users or API Keys?
    // Let's say Editor can manage Projects and Walkthroughs.
    if (editorRole) {
        const editorPerms = allPermissions.filter((p: any) =>
            (p.name.startsWith('projects:') || p.name.startsWith('walkthroughs:')) &&
            p.name.endsWith(':organization')
        );

        for (const p of editorPerms) {
            await db.insert(rolePermissions).values({
                roleId: editorRole.id,
                permissionId: p.id
            }).onConflictDoNothing();
        }
        console.log('   -> Editor granted content permissions.');
    }

    // 3. Viewer (Read Only)
    if (viewerRole) {
        const viewerPerms = allPermissions.filter((p: any) =>
            p.name.includes(':read:') &&
            p.name.endsWith(':organization')
        );

        for (const p of viewerPerms) {
            await db.insert(rolePermissions).values({
                roleId: viewerRole.id,
                permissionId: p.id
            }).onConflictDoNothing();
        }
        console.log('   -> Viewer granted read-only permissions.');
    }
}
