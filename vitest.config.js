import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Phaser's "main" is CommonJS source with build-time globals; tests use the prebuilt ESM bundle.
    alias: {
      phaser: fileURLToPath(new URL('./node_modules/phaser/dist/phaser.esm.js', import.meta.url)),
    },
  },
  test: {
    // jsdom lets Phaser-importing modules load; pure modules run fine in it too.
    environment: 'jsdom',
    include: ['src/**/*.test.js', 'tests/**/*.test.js'],
    setupFiles: ['tests/setup/canvas.js'],
  },
});
