import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // 1. Global Ignores (HARUS berada di objek paling atas tanpa properti lain)
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/target/**',
      '**/build/**',
      'templates/**',
      'android/**',
      'dotnet/**',
      'native/**',
      'apps/nest/**',
      "apps/analog"
    ],
  },

  // 2. Base Config JavaScript
  js.configs.recommended,

  // 3. Konfigurasi Standar TypeScript (Otomatis mengatur TS parser & recommended rules)
  ...tseslint.configs.recommended,

  // 4. Custom Override Rules & Environment Globals
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Gunakan rule no-unused-vars milik TypeScript agar type/interface tidak dianggap error
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',

      'no-console': 'off',
      'eqeqeq': ['error', 'always'],
    },
  },
  eslintConfigPrettier,
];