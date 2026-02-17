import { drizzleAdapter } from '../../src/adapters';
import { users, userRoles } from '../../src/db/schema';
import bcrypt from 'bcryptjs';

const db = (drizzleAdapter as any).db;

export async function seed(context: any) {
    console.log('🌱 Seeding users...');

    const scooticketOrg = context.organizations?.['scooticket'];
    const donecOrg = context.organizations?.['donec'];

    if (!scooticketOrg) {
        console.warn('⚠️ No Scooticket organization found in context.');
    }
    if (!donecOrg) {
        console.warn('⚠️ No Donec organization found in context.');
    }

    const hashedPassword = await bcrypt.hash('secret123', 10);

    // 1. Super Admin User
    const [superAdminUser] = await db.insert(users)
        .values({
            email: 'superadmin@superdamin.com',
            organizationId: scooticketOrg?.id, // Super admin can be assigned to first org
            firstName: 'Super',
            lastName: 'Admin',
            password: hashedPassword,
            status: 'active'
        })
        .onConflictDoUpdate({
            target: users.email,
            set: { firstName: 'Super', lastName: 'Admin', password: hashedPassword }
        })
        .returning();

    // Assign 'superadmin' role
    if (context.roles?.superadmin) {
        await db.insert(userRoles)
            .values({
                userId: superAdminUser.id,
                roleId: context.roles.superadmin.id
            })
            .onConflictDoNothing();
    }

    // 2. Admin User - fvargas.eme@gmail.com (admin of Scooticket)
    const [fvargasUser] = await db.insert(users)
        .values({
            email: 'fvargas.eme@gmail.com',
            organizationId: scooticketOrg?.id,
            firstName: 'Fabian',
            lastName: 'Vargas',
            password: hashedPassword,
            status: 'active'
        })
        .onConflictDoUpdate({
            target: users.email,
            set: { firstName: 'Fabian', lastName: 'Vargas', organizationId: scooticketOrg?.id, password: hashedPassword }
        })
        .returning();

    // Assign 'admin' role
    if (context.roles?.admin) {
        await db.insert(userRoles)
            .values({
                userId: fvargasUser.id,
                roleId: context.roles.admin.id
            })
            .onConflictDoNothing();
    }

    // 3. Admin User - donec.dev@gmail.com (admin of Donec)
    const [donecAdminUser] = await db.insert(users)
        .values({
            email: 'donec.dev@gmail.com',
            organizationId: donecOrg?.id,
            firstName: 'Donec',
            lastName: 'Dev',
            password: hashedPassword,
            status: 'active'
        })
        .onConflictDoUpdate({
            target: users.email,
            set: { firstName: 'Donec', lastName: 'Dev', organizationId: donecOrg?.id, password: hashedPassword }
        })
        .returning();

    // Assign 'admin' role
    if (context.roles?.admin) {
        await db.insert(userRoles)
            .values({
                userId: donecAdminUser.id,
                roleId: context.roles.admin.id
            })
            .onConflictDoNothing();
    }

    // 4. Invited Member - fabian.donec@gmail.com (member invited by Donec admin)
    const [invitedMemberUser] = await db.insert(users)
        .values({
            email: 'fabian.donec@gmail.com',
            organizationId: donecOrg?.id,
            firstName: 'Fabian',
            lastName: 'Donec',
            password: hashedPassword,
            status: 'active'
        })
        .onConflictDoUpdate({
            target: users.email,
            set: { firstName: 'Fabian', lastName: 'Donec', organizationId: donecOrg?.id, password: hashedPassword }
        })
        .returning();

    // Assign 'viewer' role (invited member)
    if (context.roles?.viewer) {
        await db.insert(userRoles)
            .values({
                userId: invitedMemberUser.id,
                roleId: context.roles.viewer.id
            })
            .onConflictDoNothing();
    }

    return { superAdminUser, fvargasUser, donecAdminUser, invitedMemberUser };
}
