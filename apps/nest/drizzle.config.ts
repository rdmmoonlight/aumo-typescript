import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { resolve } from 'node:path';

// Load .env dari folder apps/nest
dotenv.config({ path: resolve(__dirname, '.env') });

if (!process.env.DIRECT_URL) {
  throw new Error('❌ DIRECT_URL tidak ditemukan di environment variables!');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts', // Targetkan file index schema
  out: './src/db/schema',              // Folder output hasil file SQL migrasi
  dbCredentials: {
    url: process.env.DIRECT_URL,
  },
  strict: true,
  verbose: true,
  casing: 'snake_case',
});