import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts', // Node.js entry point
    browser: 'src/browser.ts', // Browser entry point
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  target: 'es2022',
});
