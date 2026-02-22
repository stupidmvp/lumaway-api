
import { db } from '../src/adapters';
import { walkthroughs, projects, apiKeys } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('--- Projects ---');
    const allProjects = await db.select().from(projects);
    allProjects.forEach(p => console.log(`${p.name} (${p.id})`));

    console.log('\n--- API Keys ---');
    const allKeys = await db.select().from(apiKeys);
    allKeys.forEach(k => console.log(`${k.key.substring(0, 10)}... -> Project: ${k.projectId}`));

    console.log('\n--- Walkthroughs ---');
    const allWalkthroughs = await db.select().from(walkthroughs);
    allWalkthroughs.forEach(w => {
        console.log(`[${w.isPublished ? 'PUBLISHED' : 'DRAFT'}] ${w.title} (${w.id}) -> Project: ${w.projectId}`);
    });

    process.exit(0);
}

main().catch(console.error);
