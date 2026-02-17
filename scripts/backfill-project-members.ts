/**
 * One-off script to backfill project_members table.
 * Adds existing project owners as 'owner' members.
 *
 * Run with: npx tsx scripts/backfill-project-members.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../src/adapters';
import { projects, projectMembers } from '../src/db/schema';

async function backfill() {
    console.log('Fetching all projects...');
    const allProjects = await db.select({ id: projects.id, ownerId: projects.ownerId }).from(projects);

    console.log(`Found ${allProjects.length} projects`);

    let created = 0;
    let skipped = 0;

    for (const project of allProjects) {
        if (!project.ownerId) {
            console.log(`  Skipping project ${project.id}: no ownerId`);
            skipped++;
            continue;
        }

        try {
            await db.insert(projectMembers).values({
                projectId: project.id,
                userId: project.ownerId,
                role: 'owner',
            }).onConflictDoNothing();
            created++;
            console.log(`  ✓ Added owner membership for project ${project.id}`);
        } catch (err: any) {
            console.log(`  ⚠ Skipped project ${project.id}: ${err.message}`);
            skipped++;
        }
    }

    console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
    process.exit(0);
}

backfill().catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
});


