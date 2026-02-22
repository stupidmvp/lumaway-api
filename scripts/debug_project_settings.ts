import { db } from './src/adapters';
import { apiKeys, projects } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const key = 'sk_b8b04817c988d0e65ea9a9a708d8745b567f7b6c846c79df';
    const [keyRecord] = await db.select().from(apiKeys).where(eq(apiKeys.key, key)).limit(1);
    if (!keyRecord) {
        console.log('Key not found');
        process.exit(0);
    }
    const [project] = await db.select().from(projects).where(eq(projects.id, keyRecord.projectId)).limit(1);
    console.log(JSON.stringify(project, null, 2));
    process.exit(0);
}
main();
