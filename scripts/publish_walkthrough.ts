
import { db } from '../src/adapters';
import { walkthroughs } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const id = 'd019e27b-b3ff-4e77-866b-79f274273618';
    console.log(`Publishing walkthrough ${id}...`);

    await db.update(walkthroughs)
        .set({ isPublished: true })
        .where(eq(walkthroughs.id, id));

    console.log('Published!');
    process.exit(0);
}

main().catch(console.error);
