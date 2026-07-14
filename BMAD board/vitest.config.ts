import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/renderer/setupTests.ts'],
    environmentMatchGlobs: [
      ['src/main/**', 'node'],
      ['src/renderer/**', 'jsdom'],
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
    },
  },
});
