import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/static-web-app.yml'), 'utf8');
const runbook = fs.readFileSync(path.join(root, 'docs/production-smoke-and-rollback.md'), 'utf8');
const smoke = fs.readFileSync(path.join(root, 'scripts/smoke-test.sh'), 'utf8');

const SECRET_PATTERNS = [
  /AccountKey=/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /password\s*[:=]\s*\S+/i,
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  /api_token:\s*(?!\$\{\{\s*secrets\.)\S+/,
];

describe('static-web-app workflow', () => {
  it('triggers on pull requests, pushes to main and manual dispatch', () => {
    expect(workflow).toMatch(/^\s{2}pull_request:/m);
    expect(workflow).toMatch(/push:\n\s+branches: \[main\]/);
    expect(workflow).toMatch(/^\s{2}workflow_dispatch:/m);
  });

  it('installs with npm ci on Node 22 before lint, tests and build', () => {
    expect(workflow).toMatch(/actions\/setup-node@[0-9a-f]{40} # v4[.\d]*\n\s+with:\n\s+node-version: 22/);
    const order = ['npm ci', 'npm run lint', 'npm run test:run', 'npm run build'].map((command) => workflow.indexOf(command));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('uploads dist as a named artifact after the build', () => {
    expect(workflow).toMatch(/actions\/upload-artifact@[0-9a-f]{40} # v4[.\d]*\n\s+with:\n\s+name: \$\{\{ env\.ARTIFACT_NAME \}\}\n\s+path: dist/);
    expect(workflow.indexOf('actions/upload-artifact')).toBeGreaterThan(workflow.indexOf('npm run build'));
  });

  it('deploys with Azure/static-web-apps-deploy from / with output dist and a secret reference only', () => {
    expect(workflow).toMatch(/Azure\/static-web-apps-deploy@[0-9a-f]{40}/);
    expect(workflow).toContain('${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}');
    expect(workflow).toMatch(/app_location: \//);
    expect(workflow).toMatch(/output_location: dist/);
  });

  it('gates deployment on validation and scanning, and production on an environment', () => {
    expect(workflow).toMatch(/build:\n[\s\S]*?needs: validate/);
    for (const job of ['deploy-preview', 'deploy-staging', 'deploy-production']) {
      expect(workflow).toMatch(new RegExp(`${job}:\\n[\\s\\S]*?needs: \\[build, scan\\]`));
    }
    expect(workflow).toMatch(/environment:\n\s+name: production/);
  });

  it('runs a fail-closed curl smoke test after the production deploy', () => {
    expect(workflow.indexOf('smoke-production:')).toBeGreaterThan(workflow.search(/name: Deploy production\n\s+uses: Azure\/static-web-apps-deploy/));
    expect(workflow).toMatch(/needs: deploy-production/);
    expect(workflow).toMatch(/curl --fail[^\n]*\$PRODUCTION_URL/);
    expect(workflow).toContain('vars.PRODUCTION_URL');
    expect(smoke).toMatch(/set -euo pipefail/);
    expect(smoke).toContain('id="game"');
    expect(smoke).toMatch(/= "200"/);
  });

  it('records the deployed artifact and supports artifact rollback by run id', () => {
    expect(workflow).toContain('ARTIFACT_NAME: static-site-${{ github.sha }}');
    expect(workflow).toMatch(/run-id: \$\{\{ inputs\.artifact_run_id \}\}/);
    expect(workflow).toContain('GITHUB_STEP_SUMMARY');
  });

  it('pins every action to a full commit SHA and the scanner image to a digest', () => {
    const uses = [...workflow.matchAll(/uses:\s*(\S+)/g)].map((match) => match[1]);
    expect(uses.length).toBeGreaterThan(5);
    for (const reference of uses) expect(reference, reference).toMatch(/@[0-9a-f]{40}$/);
    expect(workflow).toMatch(/ghcr\.io\/gitleaks\/gitleaks:v[\d.]+@sha256:[0-9a-f]{64}/);
  });

  it('keeps npm run test:run as a required validation step', () => {
    expect(workflow).toMatch(/- name: Unit tests\n\s+run: npm run test:run/);
  });

  it('contains no literal credentials', () => {
    for (const pattern of SECRET_PATTERNS) {
      expect(workflow).not.toMatch(pattern);
      expect(runbook).not.toMatch(pattern);
    }
  });
});

describe('rollback runbook', () => {
  it('documents dispatch-based rollback to a previous artifact or tag', () => {
    expect(runbook).toContain('workflow_dispatch');
    expect(runbook).toMatch(/artifact_run_id/);
    expect(runbook).toMatch(/previous tag/i);
    expect(runbook).toContain('Azure/static-web-apps-deploy');
  });

  it('states the 15 minute recovery target and a curl -I verification', () => {
    expect(runbook).toMatch(/15 minutes/);
    expect(runbook).toMatch(/curl -I https:\/\//);
    expect(runbook).toMatch(/200/);
  });
});
