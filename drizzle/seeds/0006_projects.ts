import { drizzleAdapter } from '../../src/adapters';
import { projects, projectMembers } from '../../src/db/schema';

const db = (drizzleAdapter as any).db;

/**
 * Seed projects and project members for each organization.
 */
export async function seed(context: any) {
    console.log('🌱 Seeding projects...');

    const scooticketOrg = context.organizations?.['scooticket'];
    const donecOrg = context.organizations?.['donec'];

    const createdProjects: any = {};

    // ── Project 1: Scooticket App (Scooticket org, owned by fvargas) ──
    if (scooticketOrg && context.fvargasUser) {
        const [scooticketProject] = await db.insert(projects)
            .values({
                organizationId: scooticketOrg.id,
                name: 'Scooticket App',
                ownerId: context.fvargasUser.id,
                status: 'active',
            })
            .returning();

        createdProjects.scooticketApp = scooticketProject;

        // Add fvargas as project owner
        await db.insert(projectMembers)
            .values({
                projectId: scooticketProject.id,
                userId: context.fvargasUser.id,
                role: 'owner',
            })
            .onConflictDoNothing();

        // Add superadmin as project editor (so they can access it too)
        if (context.superAdminUser) {
            await db.insert(projectMembers)
                .values({
                    projectId: scooticketProject.id,
                    userId: context.superAdminUser.id,
                    role: 'editor',
                })
                .onConflictDoNothing();
        }

        console.log(`   ✅ Created project: "${scooticketProject.name}" (Scooticket)`);
    }

    // ── Project 2: Donec Platform (Donec org, owned by donec.dev) ──
    if (donecOrg && context.donecAdminUser) {
        const [donecProject] = await db.insert(projects)
            .values({
                organizationId: donecOrg.id,
                name: 'Donec Platform',
                ownerId: context.donecAdminUser.id,
                status: 'active',
            })
            .returning();

        createdProjects.donecPlatform = donecProject;

        // Add donec.dev as project owner
        await db.insert(projectMembers)
            .values({
                projectId: donecProject.id,
                userId: context.donecAdminUser.id,
                role: 'owner',
            })
            .onConflictDoNothing();

        // Add fabian.donec (invited member) as project viewer
        if (context.invitedMemberUser) {
            await db.insert(projectMembers)
                .values({
                    projectId: donecProject.id,
                    userId: context.invitedMemberUser.id,
                    role: 'viewer',
                })
                .onConflictDoNothing();
        }

        console.log(`   ✅ Created project: "${donecProject.name}" (Donec)`);
    }

    console.log(`   ✅ Seeded ${Object.keys(createdProjects).length} projects with members`);

    return { projects: createdProjects };
}


