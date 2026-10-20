/// <reference types="vitest" />
import analog from '@analogjs/platform';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
    plugins: [analog()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/setup-tests.ts'],
        include: ['src/**/*.spec.ts'],
    },
}));