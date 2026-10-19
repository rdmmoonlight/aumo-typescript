import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/target/**', 'templates/**', 'android/**', 'dotnet/**', 'native/**', `apps/nest/**`] },
  js.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node }
    },
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'off',
      'eqeqeq': ['error', 'always']
    }
  }
];
