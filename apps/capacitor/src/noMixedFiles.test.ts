import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const FORBIDDEN_EXTENSIONS = ['.tsx', '.jsx', '.vue', '.svelte'];
const FORBIDDEN_DEPENDENCIES = ['react', 'react-dom', 'preact', 'vue', 'svelte'];

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

describe('proyek tanpa React/framework UI', () => {
  it('tidak ada berkas campuran (.tsx, .jsx, .vue, .svelte) di src', () => {
    const offenders = listFiles('src').filter((f) =>
      FORBIDDEN_EXTENSIONS.some((ext) => f.endsWith(ext))
    );
    expect(offenders).toEqual([]);
  });

  it('package.json tidak memuat dependensi framework UI', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    const offenders = names.filter(
      (n) =>
        FORBIDDEN_DEPENDENCIES.includes(n) ||
        n.startsWith('@types/react') ||
        n.includes('plugin-react')
    );
    expect(offenders).toEqual([]);
  });
});
