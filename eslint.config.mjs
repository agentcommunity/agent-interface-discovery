// eslint.config.mjs
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';


/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  /* ---------------------------------------------------- *
   * 1. Ignore junk                                       *
   * ---------------------------------------------------- */
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      'eslint.config.mjs',
    ],
  },

  /* ---------------------------------------------------- *
   * 2. Base JS rules (eslint:recommended)                *
   * ---------------------------------------------------- */
  js.configs.recommended,

  /* ---------------------------------------------------- *
   * 3. Browser + TS source files (packages/web)          *
   * ---------------------------------------------------- */
  {
    files: ['packages/web/src/**/*.ts', 'packages/web/src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './packages/web/tsconfig.eslint.json',
        sourceType: 'module',
        ecmaVersion: 2022,
      },
      globals: { ...globals.browser, ...globals.es2022 },
    },
    plugins: { '@typescript-eslint': tsPlugin, unicorn },
    rules: {
      /* Type-aware rules */
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs['recommended-type-checked'].rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',

      /* Unicorn */
      ...unicorn.configs.recommended.rules,
      'unicorn/prefer-node-protocol': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/switch-case-braces': 'off',
      'unicorn/no-for-loop': 'off',
      'unicorn/filename-case': [
        'error',
        {
          cases: { kebabCase: true, pascalCase: true },
          ignore: ['\\[.*\\]\\.tsx?$', '\\.d\\.ts$'],
        },
      ],
    },
  },

  /* ---------------------------------------------------- *
   * 4. Other TS files (no type-checking)                  *
   * ---------------------------------------------------- */
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      'packages/web/src/**',
      '**/*.d.ts',
      '**/*.{test,spec}.ts',
      '**/*.{test,spec}.tsx',
    ],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2022 },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'no-undef': 'off',
    },
  },

  /* ---------------------------------------------------- *
   * 5. Test files (Jest / Vitest)                        *
   * ---------------------------------------------------- */
  {
    files: ['**/*.{test,spec}.ts', '**/*.{test,spec}.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.jest, ...globals.node, ...globals.es2022 },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off',
    },
  },

  /* ---------------------------------------------------- *
   * 6. Node-only build / config scripts (.js / .cjs)      *
   * ---------------------------------------------------- */
  {
    files: [
      '*.config.{js,cjs}',
      'scripts/**/*.{js,cjs}',
      '.lint*rc.js',
      'packages/web/*.config.js',
      'packages/web/*.config.cjs',
    ],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.node, ...globals.es2022 },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
];
