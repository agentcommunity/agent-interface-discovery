import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Avoid worker threads in constrained/sandboxed environments
    pool: 'forks',
    environment: 'node',
    isolate: true,
  },
});
