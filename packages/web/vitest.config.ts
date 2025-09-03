import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Use jsdom for browser-like environment since this is a Next.js project
    environment: 'jsdom',
    // Setup files if needed
    setupFiles: [],
    // Include test files
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
