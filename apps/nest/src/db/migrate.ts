import dotenv from 'dotenv';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path relatif dari apps/nest/src/db ke apps/nest
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const runMigration = async () => {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ ERROR: DATABASE_URL tidak ditemukan di .env');
        process.exit(1);
    }

    console.log('⏳ Mengirim koneksi ke Neon database...');

    const sql = postgres(connectionString, { max: 1, ssl: 'require' });
    const db = drizzle(sql);

    console.log('🚀 Menjalankan migrasi Drizzle...');

    try {
        // Memastikan path menunjuk tepat ke apps/nest/drizzle
        const migrationsFolder = path.resolve(__dirname, '../../drizzle');
        console.log(`📁 Lokasi folder migrasi: ${migrationsFolder}`);

        await migrate(db, { migrationsFolder });
        console.log('✅ Migrasi berhasil dijalankan!');
    } catch (error) {
        console.error('❌ Migrasi gagal:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
};

runMigration();