import { randomBytes } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

/**
 * Tes integrasi hanya berjalan bila TEST_DATABASE_URL diisi, mis.
 * postgres://postgres:test@127.0.0.1:5432/postgres. Pengguna harus boleh membuat database.
 * Tiap berkas tes membuat database sementara sendiri (aman dijalankan paralel) lalu menghapusnya.
 */
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

const MIGRATIONS_DIR = new URL('../../db/schema/', import.meta.url);

export interface TestDatabase {
    db: NodePgDatabase;
    dispose: () => Promise<void>;
}

export async function createTestDatabase(): Promise<TestDatabase> {
    const name = `aumo_test_${randomBytes(6).toString('hex')}`;
    const admin = new Pool({ connectionString: TEST_DATABASE_URL });
    await admin.query(`CREATE DATABASE ${name}`);

    const url = new URL(TEST_DATABASE_URL as string);
    url.pathname = `/${name}`;
    const pool = new Pool({ connectionString: url.toString() });

    const files = readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();
    for (const file of files) {
        const sql = readFileSync(new URL(file, MIGRATIONS_DIR), 'utf8');
        for (const statement of sql.split('--> statement-breakpoint')) {
            if (statement.trim()) await pool.query(statement);
        }
    }

    return {
        db: drizzle(pool, { casing: 'snake_case' }),
        dispose: async () => {
            await pool.end();
            // Server butuh sesaat untuk membebaskan koneksi yang baru ditutup.
            for (let attempt = 0; attempt < 10; attempt++) {
                try {
                    await admin.query(`DROP DATABASE IF EXISTS ${name}`);
                    break;
                } catch (error) {
                    if (attempt === 9) throw error;
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            }
            await admin.end();
        },
    };
}
