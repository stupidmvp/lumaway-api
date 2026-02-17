import { drizzleAdapter } from '../../src/adapters';
import { organizations } from '../../src/db/schema';

const db = (drizzleAdapter as any).db;

export async function seed(context: any) {
    console.log('🌱 Seeding organizations...');

    const orgData = [
        { name: 'Scooticket', slug: 'scooticket' },
        { name: 'Donec', slug: 'donec' }
    ];

    const createdOrgs = await db.insert(organizations)
        .values(orgData)
        .onConflictDoUpdate({
            target: organizations.slug,
            set: { name: organizations.name }
        })
        .returning();

    const orgMap = createdOrgs.reduce((acc: any, org: any) => {
        acc[org.slug] = org;
        return acc;
    }, {});

    return { organizations: orgMap };
}
