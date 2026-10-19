import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { logger } from '../lib/logger.js';
import * as schema from './schema/index.js';
export const databaseProvider = {
    provide: 'DATABASE',
    useFactory: async () => {
        try {
            const url = process.env.DATABASE_URL;
            if (!url) {
                throw new Error('DATABASE_URL environment variable is missing');
            }
            const pool = new Pool({
                connectionString: url,
                ssl: { rejectUnauthorized: false },
            });
            pool.on('error', (err) => {
                logger.error({ err }, 'Database pool background error');
            });
            return drizzle(pool, { schema });
        }
        catch (e) {
            logger.error({ err: e }, 'Database provider initialization failed');
            throw e;
        }
    },
};
//# sourceMappingURL=database.provider.js.map