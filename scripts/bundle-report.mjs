// CI bundle report: prints dist sizes and fails when the startup budget is exceeded.
// Run after `npm run build`: node scripts/bundle-report.mjs [distDir]
import path from 'node:path';
import { collectDistAssets, evaluateStartupBudget, formatBudgetReport } from './performanceBudget.js';

const distDir = path.resolve(process.argv[2] ?? 'dist');
const { error, assets } = collectDistAssets(distDir);
if (error) {
  console.error(`No build output at ${distDir}. Run npm run build first.`);
  process.exit(1);
}
const result = evaluateStartupBudget(assets);
console.log(formatBudgetReport(result, assets));
process.exit(result.withinBudget ? 0 : 1);
