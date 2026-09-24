// Measures the built static artifact against PERFORMANCE_BUDGETS. Shared by the
// performance test and the CI bundle report.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { PERFORMANCE_BUDGETS } from '../src/config/performance.js';

// Every file in dist is fetched before the title screen (all assets preload), so
// the whole artifact counts as startup payload except source maps.
export function collectDistAssets(distDir) {
  if (!fs.existsSync(distDir)) return { error: 'dist-missing', distDir, assets: [] };
  const assets = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (!entry.name.endsWith('.map')) {
        const content = fs.readFileSync(full);
        assets.push({ path: path.relative(distDir, full), bytes: content.length, gzipBytes: zlib.gzipSync(content, { level: 9 }).length });
      }
    }
  };
  walk(distDir);
  return { error: null, distDir, assets };
}

export function evaluateStartupBudget(assets, budgets = PERFORMANCE_BUDGETS) {
  const totalCompressed = assets.reduce((sum, asset) => sum + asset.gzipBytes, 0);
  const totalUncompressed = assets.reduce((sum, asset) => sum + asset.bytes, 0);
  const largest = [...assets].sort((a, b) => b.gzipBytes - a.gzipBytes)[0] ?? null;
  const withinStartup = totalCompressed <= budgets.startupCompressedBytes;
  const withinArtifact = totalUncompressed <= budgets.artifactUncompressedBytes;
  return {
    withinBudget: withinStartup && withinArtifact,
    totalCompressed,
    totalUncompressed,
    startupBudget: budgets.startupCompressedBytes,
    overBy: Math.max(0, totalCompressed - budgets.startupCompressedBytes),
    largest,
    message: withinStartup && withinArtifact
      ? `Startup payload ${formatBytes(totalCompressed)} gzip is within ${formatBytes(budgets.startupCompressedBytes)}.`
      : `Startup payload over budget: ${formatBytes(totalCompressed)} gzip / ${formatBytes(totalUncompressed)} raw. Largest asset: ${largest?.path} (${formatBytes(largest?.gzipBytes ?? 0)} gzip).`,
  };
}

export function formatBytes(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
}

export function formatBudgetReport(result, assets) {
  const rows = [...assets]
    .sort((a, b) => b.gzipBytes - a.gzipBytes)
    .map((asset) => `  ${formatBytes(asset.gzipBytes).padStart(10)} gzip  ${formatBytes(asset.bytes).padStart(10)} raw  ${asset.path}`);
  return [result.message, ...rows].join('\n');
}
