import { drizzleAdapter } from '../../src/adapters';
import { organizationMembers } from '../../src/db/schema';

const db = (drizzleAdapter as any).db;

/**
 * Seed organization_members based on the seeded users and organizations.
 */
export async function seed(context: any) {
    console.log('🌱 Seeding organization members...');

    const scooticketOrg = context.organizations?.['scooticket'];
    const donecOrg = context.organizations?.['donec'];

    let seeded = 0;

    // fvargas.eme@gmail.com -> owner of Scooticket
    if (scooticketOrg && context.fvargasUser) {
        await db.insert(organizationMembers)
            .values({
                organizationId: scooticketOrg.id,
                userId: context.fvargasUser.id,
                role: 'owner',
            })
            .onConflictDoNothing();
        seeded++;
    }

    // donec.dev@gmail.com -> owner of Donec
    if (donecOrg && context.donecAdminUser) {
        await db.insert(organizationMembers)
            .values({
                organizationId: donecOrg.id,
                userId: context.donecAdminUser.id,
                role: 'owner',
            })
            .onConflictDoNothing();
        seeded++;
    }

    // fabian.donec@gmail.com -> member of Donec (invited by Donec admin)
    if (donecOrg && context.invitedMemberUser) {
        await db.insert(organizationMembers)
            .values({
                organizationId: donecOrg.id,
                userId: context.invitedMemberUser.id,
                role: 'member',
            })
            .onConflictDoNothing();
        seeded++;
    }

    // superadmin@superdamin.com -> admin of Scooticket (optional, for access)
    if (scooticketOrg && context.superAdminUser) {
        await db.insert(organizationMembers)
            .values({
                organizationId: scooticketOrg.id,
                userId: context.superAdminUser.id,
                role: 'admin',
            })
            .onConflictDoNothing();
        seeded++;
    }

    console.log(`   ✅ Seeded ${seeded} organization memberships`);

    return {};
}
