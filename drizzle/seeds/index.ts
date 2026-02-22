import { drizzleAdapter } from '../../src/adapters';
import {
    users, roles, userRoles, permissions, modules, rolePermissions,
    organizations, organizationMembers, projects, apiKeys, walkthroughs,
    walkthroughVersions, projectMembers, projectInvitations, comments,
    commentAttachments, commentMentions, notifications, systemSecrets,
    subscriptionPlans, tenantLlmKeys
} from '../../src/db/schema';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get raw DB instance for direct seeding
const db = (drizzleAdapter as any).db;

// Export for individual seed files
export { db };
// Export schema for individual seed files
export * as schema from '../../src/db/schema';

async function runSeeds() {
    try {
        console.log('🌱 Starting LumaWay seed runner...\n');

        // Clean DB - delete in reverse dependency order
        console.log('🗑️  Cleaning database...');
        await db.delete(tenantLlmKeys);
        await db.delete(systemSecrets);
        await db.delete(commentMentions);
        await db.delete(commentAttachments);
        await db.delete(comments);
        await db.delete(notifications);
        await db.delete(projectInvitations);
        await db.delete(projectMembers);
        await db.delete(walkthroughVersions);
        await db.delete(walkthroughs);
        await db.delete(apiKeys);
        await db.delete(projects);
        await db.delete(organizationMembers);
        await db.delete(userRoles);
        await db.delete(rolePermissions);
        await db.delete(permissions);
        await db.delete(modules);
        await db.delete(users);
        await db.delete(roles);
        await db.delete(organizations);
        await db.delete(subscriptionPlans);
        console.log('   ✅ Database cleaned.\n');

        const seedsDir = __dirname;
        const seedFiles = fs.readdirSync(seedsDir)
            .filter(file => file.match(/^\d{4}_.*\.ts$/) && file !== 'index.ts')
            .sort();

        console.log(`📂 Found ${seedFiles.length} seed files\n`);

        let context: any = {};

        for (const seedFile of seedFiles) {
            const seedName = seedFile.replace('.ts', '');
            console.log(`▶️  Running seed: ${seedName}`);

            try {
                const seedModule = await import(path.join(seedsDir, seedFile));
                const result = await seedModule.seed(context);
                context = { ...context, ...result };
                console.log(`✅ Seed completed: ${seedName}\n`);
            } catch (error) {
                console.error(`❌ Seed failed: ${seedName}`);
                throw error;
            }
        }

        console.log('\n✨ All seeds completed successfully!');

        console.log('\n📋 SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Organizations:');
        if (context.organizations) {
            Object.values(context.organizations).forEach((o: any) => {
                console.log(`   - ${o.name} (${o.slug})`);
            });
        }
        console.log('\nUsers:');
        if (context.superAdminUser) {
            console.log(`   - ${context.superAdminUser.email} → superadmin`);
        }
        if (context.fvargasUser) {
            console.log(`   - ${context.fvargasUser.email} → admin (Scooticket)`);
        }
        if (context.donecAdminUser) {
            console.log(`   - ${context.donecAdminUser.email} → admin (Donec)`);
        }
        if (context.invitedMemberUser) {
            console.log(`   - ${context.invitedMemberUser.email} → member (Donec)`);
        }
        console.log('\nPassword: secret123');

        console.log('\n👑 ROLES Created:');
        if (context.roles) {
            Object.values(context.roles).forEach((r: any) => {
                console.log(`   - ${r.name}: ${r.description}`);
            });
        }

        console.log('\n📁 PROJECTS Created:');
        if (context.projects) {
            Object.values(context.projects).forEach((p: any) => {
                console.log(`   - ${p.name} (org: ${p.organizationId}, status: ${p.status})`);
            });
        }

        console.log('\n🔐 SYSTEM SECRETS Seeded:');
        if (context.systemSecrets) {
            context.systemSecrets.forEach((s: any) => {
                const masked = s.keyValue.length > 4 ? `${'•'.repeat(s.keyValue.length - 4)}${s.keyValue.slice(-4)}` : '••••';
                console.log(`   - ${s.keyName} (${s.provider}): ${masked}`);
            });
        }

    } catch (error) {
        console.error('\n❌ Seed runner failed:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runSeeds();
