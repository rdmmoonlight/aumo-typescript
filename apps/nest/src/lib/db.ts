import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema/index.js';

const loggerModulePath: string = '../../../libs/logger/src/index.js';
const { logger } = await import(loggerModulePath);

const url = process.env.DATABASE_URL;
export let db: ReturnType<typeof drizzle> | null = null;
export let pool: Pool | null = null;

if (!url) {
  logger.error('DATABASE_URL environment variable is missing');
} else {
  pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  pool.on('error', (e: Error) => logger.error({ err: e }, 'Database pool background error'));
  db = drizzle(pool, { schema });
}
