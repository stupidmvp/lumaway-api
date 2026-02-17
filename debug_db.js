
const { Pool } = require('pg');

async function main() {
    const pool = new Pool({
        connectionString: "postgresql://neondb_owner:npg_vHyEpO8XBGg0@ep-noisy-silence-airp1oow-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
    });

    try {
        const walkthroughId = '52531f68-3fae-4ce3-a14d-c3f1c6fd5003';
        const apiKey = 'sk_d926524982aaea6025e2fce6f8509368b629fdcd71ecff6f';

        console.log('--- WALKTHROUGH CHECK ---');
        const resW = await pool.query('SELECT id, project_id, is_published FROM walkthroughs WHERE id = $1', [walkthroughId]);
        console.log(resW.rows[0]);

        console.log('\n--- API KEY CHECK ---');
        const resK = await pool.query('SELECT project_id FROM api_keys WHERE key = $1', [apiKey]);
        console.log(resK.rows[0]);

        if (resW.rows[0] && resK.rows[0]) {
            const match = resW.rows[0].project_id === resK.rows[0].project_id;
            console.log(`\nProject IDs match: ${match}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
