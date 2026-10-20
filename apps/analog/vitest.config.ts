/// <reference types="vitest" />
import analog from '@analogjs/platform';
import vitestAngular from '@analogjs/vitest-angular';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
    plugins: [
        analog(),
        vitestAngular(),
    ],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['src/test-setup.ts'],
        include: ['src/**/*.spec.ts'],
        reporters: ['default'],
    },
}));