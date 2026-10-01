import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  clearScreen: false,
  server: {
    host: true,
    port: 5173,
    strictPort: true
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsInlineLimit: 0
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
