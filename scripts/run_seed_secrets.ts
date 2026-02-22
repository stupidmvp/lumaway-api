import { drizzleAdapter } from '../src/adapters';
import { systemSecrets } from '../src/db/schema';
import { seed } from '../drizzle/seeds/0008_system_secrets';

const db = (drizzleAdapter as any).db;

async function main() {
    // Run the seed
    await seed({});

    // Verify
    const rows = await db.select().from(systemSecrets);
    console.log(`\n✅ Verified: ${rows.length} secrets in DB`);
    rows.forEach((r: any) => {
        const masked = r.keyValue.slice(0, 6) + '...' + r.keyValue.slice(-4);
        console.log(`   ${r.keyName} (${r.provider}): ${masked}`);
    });
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
