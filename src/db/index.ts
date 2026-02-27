import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Neon serverless HTTP client.
 * Uses the DATABASE_URL environment variable for connection.
 */
const sql = neon(process.env.DATABASE_URL!);

/**
 * Drizzle ORM instance connected to Neon Postgres via HTTP.
 * @see https://orm.drizzle.team/docs/get-started/neon-new
 */
export const db = drizzle(sql, { schema });
