import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import unicornPlugin from 'eslint-plugin-unicorn';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      unicorn: unicornPlugin,
    },
    rules: {
      // TypeScript rules
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Unicorn rules
      ...unicornPlugin.configs.recommended.rules,
      'unicorn/prefer-node-protocol': 'off',
      'unicorn/no-null': 'off', // Allow null for CLI compatibility
      'unicorn/prefer-optional-catch-binding': 'off', // Allow named catch bindings
      'unicorn/prevent-abbreviations': 'off', // Allow common abbreviations like 'obj'
      'unicorn/switch-case-braces': 'off', // Allow switch cases without braces
      'unicorn/no-for-loop': 'off', // Allow for loops when appropriate
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
]; 