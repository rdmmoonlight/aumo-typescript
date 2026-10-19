import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema/index.js';
import { logger } from './logger.js';
const url = process.env.DATABASE_URL;
export let db = null;
export let pool = null;
if (!url) {
    logger.error('DATABASE_URL environment variable is missing');
}
else {
    pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
    pool.on('error', (e) => logger.error({ err: e }, 'Database pool background error'));
    db = drizzle(pool, { schema });
}
//# sourceMappingURL=db.js.map