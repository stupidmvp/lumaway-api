const { Pool } = require('pg');

async function main() {
    const pool = new Pool({
        connectionString: "postgresql://neondb_owner:npg_vHyEpO8XBGg0@ep-noisy-silence-airp1oow-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
    });

    try {
        const targetProjectId = '4d9329fb-414b-43d7-85c2-bcc4821569d1';

        console.log('--- FINDING API KEY FOR PROJECT ---');
        const res = await pool.query('SELECT key FROM api_keys WHERE project_id = $1 LIMIT 1', [targetProjectId]);

        if (res.rows.length > 0) {
            console.log('Found API key:', res.rows[0].key);
        } else {
            console.log('No API key found for this project. Creating one...');
            const newKey = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            await pool.query('INSERT INTO api_keys (key, project_id, created_at) VALUES ($1, $2, NOW())', [newKey, targetProjectId]);
            console.log('Created new API key:', newKey);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
