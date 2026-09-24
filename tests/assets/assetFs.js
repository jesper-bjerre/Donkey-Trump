import fs from 'node:fs';
import path from 'node:path';

export const repoRoot = path.resolve(import.meta.dirname, '../..');
export const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(repoRoot, relative), 'utf8'));
export const fileExists = (relative) => fs.existsSync(path.join(repoRoot, relative));
export const fileSize = (relative) => fs.statSync(path.join(repoRoot, relative)).size;
