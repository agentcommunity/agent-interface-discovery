import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    target: 'es2022',
  },
  {
    entry: ['src/cli.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false, // Don't clean twice
    splitting: false,
    treeshake: true,
    target: 'es2022',
  },
]);
