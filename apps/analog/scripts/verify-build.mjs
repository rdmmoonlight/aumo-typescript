// Gagal-cepat bila build produksi tidak memuat aplikasi Angular.
// Kasus nyata: tsconfig.app.json tanpa "src/main.ts" menghasilkan bundel
// kosong (hanya polyfill modulepreload) tetapi `vite build` tetap sukses.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = "dist/client";
const MIN_JS_BYTES = 100_000;

const fail = (msg) => {
  console.error(`verify-build: ${msg}`);
  process.exit(1);
};

if (!existsSync(join(dir, "index.html"))) fail(`${dir}/index.html tidak ada`);

const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const jsBytes = walk(dir)
  .filter((f) => f.endsWith(".js"))
  .reduce((n, f) => n + statSync(f).size, 0);

if (jsBytes < MIN_JS_BYTES)
  fail(`total JS ${jsBytes} B < ${MIN_JS_BYTES} B: aplikasi tidak ter-bundle (cek tsconfig.app.json "files")`);

const html = readFileSync(join(dir, "index.html"), "utf8");
const hasModuleScript = /<script[^>]+type="module"[^>]+src="\/assets\/[^"]+\.js"/.test(html);
if (!hasModuleScript) fail("index.html tidak memuat skrip modul");

console.log(`verify-build: OK (JS ${(jsBytes / 1024).toFixed(0)} KB)`);
