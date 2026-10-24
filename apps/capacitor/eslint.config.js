import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // 1. Abaikan folder build, node_modules, dan proyek android Capacitor
  globalIgnores(['dist', 'android', 'node_modules']),

  // 2. Konfigurasi dasar JS & Strict TypeScript
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked.map((c) => ({ ...c, files: ['**/*.ts'] })),
  ...tseslint.configs.stylisticTypeChecked.map((c) => ({ ...c, files: ['**/*.ts'] })),

  // File JS (mis. eslint.config.js) tidak ikut proyek TS, jadi tanpa aturan type-aware
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },

  // 3. Konfigurasi utama untuk file TS
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Proyek ini tanpa React/framework UI: DOM langsung dari TypeScript.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*', 'preact', 'vue'],
              message: 'Tanpa framework UI di proyek ini.',
            },
          ],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // 4. Integrasi Prettier untuk mematikan aturan ESLint yang bentrok
  eslintConfigPrettier,
]);
