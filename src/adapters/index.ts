import { DrizzleAdapter } from '@flex-donec/core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import * as dotenv from 'dotenv';
dotenv.config();

// Create Postgres Client
const client = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/lumaway');
export const db = drizzle(client, { schema });

// Extend DrizzleAdapter to expose the db instance for services
class ExtendedDrizzleAdapter extends DrizzleAdapter {
    public db: any;
    constructor(dbConfig: any) {
        super(dbConfig);
        this.db = db; // Inject the schema-aware db instance
    }
}

export const drizzleAdapter = new ExtendedDrizzleAdapter(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/lumaway');
