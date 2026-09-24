// Fails when a production dependency (anything shipped in the static bundle) has a
// license outside the allow-list. Reads package-lock.json; needs no network.
import fs from 'node:fs';
import path from 'node:path';

const ALLOWED = new Set(['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD', 'CC0-1.0', 'BlueOak-1.0.0', 'Unlicense']);

const root = path.resolve(import.meta.dirname, '..');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));

// A license expression passes when every alternative in an OR, or every term in an AND, is allowed.
function licenseAllowed(expression) {
  if (!expression) return false;
  const clean = expression.replace(/[()]/g, '');
  if (/ OR /.test(clean)) return clean.split(/ OR /).some((part) => licenseAllowed(part.trim()));
  return clean.split(/ AND /).every((part) => ALLOWED.has(part.trim()));
}

const problems = [];
let checked = 0;
for (const [location, pkg] of Object.entries(lock.packages ?? {})) {
  if (location === '' || pkg.dev || pkg.devOptional) continue;
  checked += 1;
  const license = typeof pkg.license === 'string' ? pkg.license : pkg.license?.type;
  if (!licenseAllowed(license)) problems.push(`${location.replace(/^node_modules\//, '')}@${pkg.version}: ${license ?? 'UNKNOWN'}`);
}

if (problems.length) {
  console.error(`Disallowed or unknown licenses in production dependencies:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`License check passed for ${checked} production package(s).`);
