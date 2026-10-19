import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/target/**', 'templates/**', 'android/**', 'dotnet/**', 'native/**', `apps/nest/**`, "build/**"] },
  js.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node }
    },
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'off',
      'eqeqeq': ['error', 'always']
    }
  }
];
