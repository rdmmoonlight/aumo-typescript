import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const STORE_DIR = path.join(rootDir, 'apps/next/src/lib/store');
const ROUTE_CONFIG_PATH = path.join(rootDir, 'docs/rute-api.json');

// 1. Baca daftar rute resmi
if (!fs.existsSync(ROUTE_CONFIG_PATH)) {
  console.error(`❌ File ${ROUTE_CONFIG_PATH} tidak ditemukan.`);
  process.exit(1);
}

const routeConfig = JSON.parse(fs.readFileSync(ROUTE_CONFIG_PATH, 'utf8'));
const allowedRoutes = routeConfig.routes.map((r) => r.path);

// Helper konversi rute dengan parameter dinamis ke pola pembanding
function normalizePath(rawPath) {
  let cleaned = rawPath.split('?')[0]; // buang query params
  if (!cleaned.startsWith('/')) cleaned = '/' + cleaned;
  if (cleaned.startsWith('/api/')) cleaned = cleaned.replace('/api', '');

  // Normalisasi id/parameter ${id} atau {id} menjadi :id
  return cleaned
    .replace(/\$\{[^}]+\}/g, ':id')
    .replace(/\{[^}]+\}/g, ':id');
}

// Helper rekursif cari file
function getFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries.map((entry) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
}

// 2. Pindai file di store
const files = getFiles(STORE_DIR).filter((f) => /\.(ts|js|tsx|jsx)$/.test(f));
const foundEndpoints = new Set();
const routeRegex = /(?:url|path|get|post|put|delete|patch)\s*:\s*[`'"]([^`'"]+)[`'"]/gi;

files.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const rawUrl = match[1];
    if (rawUrl.startsWith('/') || rawUrl.startsWith('api/') || rawUrl.includes('/')) {
      foundEndpoints.add({
        raw: rawUrl,
        normalized: normalizePath(rawUrl),
        file: path.relative(rootDir, filePath),
      });
    }
  }
});

// 3. Verifikasi rute terhadap docs/rute-api.json
let hasError = false;
console.log('🔍 Memeriksa rute API di Next.js store...\n');

foundEndpoints.forEach(({ raw, normalized, file }) => {
  const isAllowed = allowedRoutes.some((allowed) => {
    // Cocokkan persis atau abaikan perbedaan ID dinamis
    const allowedRegex = new RegExp('^' + allowed.replace(/:[^\s/]+/g, '[^/]+') + '$');
    return allowedRegex.test(normalized);
  });

  if (!isAllowed) {
    console.error(`❌ [TIDAK TERDAFTAR] "${raw}" (${normalized})`);
    console.error(`   Lokasi: ${file}`);
    hasError = true;
  }
});

if (hasError) {
  console.error('\n💥 Tes kontrak rute gagal! Ada rute yang belum terdaftar di docs/rute-api.json.');
  process.exit(1);
} else {
  console.log('✅ Semua rute Next.js terdaftar dengan benar di docs/rute-api.json.');
  process.exit(0);
}
