import nextPlugin from "@next/eslint-plugin-next";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**"],
  },
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];
