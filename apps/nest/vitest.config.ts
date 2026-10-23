import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  envDir: '.',
  // SWC menghasilkan metadata decorator (emitDecoratorMetadata) yang dibutuhkan DI Nest.
  // esbuild bawaan Vitest tidak menghasilkannya, sehingga constructor injection tidak berfungsi.
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/**/*.ts'],
    exclude: ['src/test/setup.ts', 'src/test/helpers/**', 'src/test/fixtures/**'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/test/**', 'src/main.ts'],
    },
  },
});
