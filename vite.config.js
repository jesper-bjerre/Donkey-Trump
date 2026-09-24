import fs from 'node:fs';
import { defineConfig } from 'vite';

// Ship the Azure Static Web Apps config (headers, CSP, caching) inside dist so the
// deployed artifact is self-contained and rollbacks restore matching headers.
function staticWebAppConfig() {
  return {
    name: 'static-web-app-config',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'staticwebapp.config.json', source: fs.readFileSync('staticwebapp.config.json', 'utf8') });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [staticWebAppConfig()],
  // Phaser's SVG loader cannot decode Vite's utf-8 data: URIs, so always emit asset files.
  build: {
    assetsInlineLimit: 0,
    // Phaser alone is ~1.2 MB minified (~340 KB gzip); keep it in its own long-cacheable chunk.
    chunkSizeWarningLimit: 1600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'phaser', test: /node_modules[\\/]phaser/ }],
        },
      },
    },
  },
});
