import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import path from 'node:path';

// Muat .env baik dari folder apps/nest maupun dari root repo
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL tidak ditemukan di environment variables!');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/db/schema/index.ts'],
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  },
  strict: true,
  verbose: true,
  casing: 'snake_case',
});