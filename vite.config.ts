import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "connect-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'"
].join('; ');

/** Adds the Content Security Policy to the built page (the dev server needs inline scripts). */
const contentSecurityPolicy = (): Plugin => ({
  name: 'xantar-content-security-policy',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
      injectTo: 'head-prepend'
    }
  ]
});

export default defineConfig({
  base: './',
  plugins: [contentSecurityPolicy()],
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
    include: ['src/**/*.test.ts', 'tools/**/*.test.ts', 'electron/**/*.test.ts']
  }
});
