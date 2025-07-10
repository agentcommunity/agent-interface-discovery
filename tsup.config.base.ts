import { defineConfig } from 'tsup';

// Base config for tsup with bulletproof settings
export const baseConfig = defineConfig({
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'es2022',
});

export default baseConfig;
