# Production smoke test and rollback runbook

**Target recovery time: 15 minutes** from detecting a bad release to a verified, restored production site.

Production is the static build in `dist/`, deployed to Azure Static Web Apps by `.github/workflows/static-web-app.yml`. Each run uploads its build as the artifact `static-site-<commit sha>` (kept 90 days). The deployment summary of every production run names the artifact it shipped.

## What the automated smoke test checks

The `Smoke test production` job runs after every production deployment and fails the workflow (fails closed) when any of these checks fail:

1. `vars.PRODUCTION_URL` is set.
2. `GET <PRODUCTION_URL>/` returns HTTP 200 (retried for up to about 100 seconds while the CDN picks up the release).
3. The page contains the app shell marker `id="game"`.
4. The first `assets/*.js` bundle referenced by `index.html` returns HTTP 200.
5. The response carries the `Content-Security-Policy`, `Strict-Transport-Security` and `X-Content-Type-Options` headers.

The same script runs locally:

```sh
npm run smoke -- https://<production-host>
```

It never collects telemetry or player data; it only issues anonymous HTTPS GET and HEAD requests.

## Rollback (redeploy a known-good release)

Use this when the smoke test fails, or when players or QA report a broken production release.

1. **Confirm the problem (≤ 2 min).** Check the failed `Smoke test production` job log, or run `npm run smoke -- <PRODUCTION_URL>` yourself.
2. **Find the last good release (≤ 3 min).** In GitHub, open **Actions → Static Web App** and filter by event `push` for tags, or by `workflow_dispatch`. Pick the most recent successful **Deploy production** run from before the bad release. Copy its run ID, the number in the run URL `.../actions/runs/<run-id>`. Its summary lists the artifact `static-site-<sha>` and the release tag, for example `v1.2.0`.
3. **Start the rollback (≤ 2 min).** Choose one of these:
   - **Redeploy the exact artifact (preferred):** open **Actions → Static Web App → Run workflow**. Select branch `main`, set `target` to `production`, set `artifact_run_id` to the run ID from step 2, then click **Run workflow**. The Azure Static Web Apps deployment action (`Azure/static-web-apps-deploy`) uploads that run's artifact byte-for-byte.
   - **Rebuild the previous release tag:** open **Run workflow**, select the previous tag (for example `v1.2.0`) as the ref, set `target` to `production`, and leave `artifact_run_id` empty. `npm ci` uses the committed lockfile, so the rebuild is reproducible.
4. **Approve (≤ 3 min).** A reviewer for the `production` environment approves the pending **Deploy production** job.
5. **Verify (≤ 3 min).** The **Smoke test production** job must pass. Then confirm by hand:

   ```sh
   curl -I https://<production-host>/
   ```

   The response must be `HTTP/2 200` (or `HTTP/1.1 200`) and include `content-security-policy`. Open the site, start level 1, move with the arrow keys, and confirm a barrel hit costs a life.
6. **Follow up.** Open an issue describing the bad release, link both workflow runs, and fix forward on `main` before tagging a new release.

## Credentials

- The deployment token lives only in the GitHub secret `AZURE_STATIC_WEB_APPS_API_TOKEN`, scoped to this Static Web App. Rotate it at least every 90 days in the Azure portal (**Static Web App → Manage deployment token**), then update the secret.
- Never paste tokens, passwords or connection strings into source files, workflow YAML, issues or this runbook. Rollback never requires handling the token directly.
- Production URLs live in the repository variables `PRODUCTION_URL` and `STAGING_URL`.
