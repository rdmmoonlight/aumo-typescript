import { defineConfig } from 'vitest/config';

export default defineConfig({
  envDir: '.',
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/**/*.ts'],
    exclude: ['src/test/setup.ts', 'src/test/helpers/**'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/test/**', 'src/main.ts'],
    },
  },
});
