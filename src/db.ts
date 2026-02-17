import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lumaway',
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
