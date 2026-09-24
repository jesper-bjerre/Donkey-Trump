import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'staticwebapp.config.json'), 'utf8'));
const csp = Object.fromEntries(
  config.globalHeaders['Content-Security-Policy'].split(';').map((part) => {
    const [name, ...values] = part.trim().split(/\s+/);
    return [name, values];
  }),
);

describe('staticwebapp.config.json', () => {
  it('sets the required security headers', () => {
    for (const header of ['Strict-Transport-Security', 'Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy']) {
      expect(config.globalHeaders[header], header).toBeTruthy();
    }
    expect(config.globalHeaders['X-Content-Type-Options']).toBe('nosniff');
  });

  it('uses a conservative same-origin CSP with no eval or third-party hosts', () => {
    expect(csp['default-src']).toEqual(["'self'"]);
    expect(csp['script-src']).toEqual(["'self'"]);
    expect(csp['style-src']).toEqual(["'self'", "'unsafe-inline'"]);
    expect(csp['img-src']).toEqual(expect.arrayContaining(["'self'", 'data:']));
    expect(csp['connect-src']).toEqual(["'self'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(config.globalHeaders['Content-Security-Policy']).not.toMatch(/unsafe-eval|https?:\/\//);
  });

  it('allows blob: images because Phaser rasterizes SVG sprites through blob URLs', () => {
    expect(csp['img-src']).toContain('blob:');
  });

  it('caches hashed assets immutably and keeps the app shell revalidating', () => {
    const assets = config.routes.find((route) => route.route === '/assets/*');
    expect(assets.headers['Cache-Control']).toMatch(/public/);
    expect(assets.headers['Cache-Control']).toMatch(/max-age=31536000/);
    expect(assets.headers['Cache-Control']).toMatch(/immutable/);
    expect(config.routes.find((route) => route.route === '/index.html').headers['Cache-Control']).toBe('no-cache');
  });

  it('falls back to the app shell without rewriting static assets', () => {
    expect(config.navigationFallback.rewrite).toBe('/index.html');
    expect(config.navigationFallback.exclude).toContain('/assets/*');
  });

  it('is included in the build output when dist exists', () => {
    const built = path.join(root, 'dist/staticwebapp.config.json');
    if (!fs.existsSync(path.join(root, 'dist/index.html'))) return;
    expect(JSON.parse(fs.readFileSync(built, 'utf8'))).toEqual(config);
  });
});
