// Pure validators for asset governance files. They return error lists instead of
// throwing so tests and release QA can report every problem at once.

export const ORIGINALITY_STATUSES = ['original-required', 'original-placeholder', 'original-approved', 'needs-review'];
export const REVIEW_STATUSES = ['missing', 'needs-review', 'approved', 'rejected'];
export const REQUIRED_ASSET_IDS = [
  'player',
  'rescue',
  'boss',
  'barrel',
  'platform',
  'ladder',
  'hud',
  'hitAudio',
  'retryAudio',
  'rescueAudio',
  'hitEffect',
  'retryEffect',
  'rescueEffect',
];
export const REGISTER_ITEM_FIELDS = [
  'id',
  'runtimeKey',
  'displayName',
  'type',
  'intendedPath',
  'requiredForLaunch',
  'originalityStatus',
  'copiedAssetProhibited',
  'reviewStatus',
  'reviewer',
  'replacementOwner',
  'notes',
];
export const MANIFEST_TYPES = ['svg', 'image', 'spritesheet', 'audio', 'json'];
export const ALLOWED_ASSET_ROOTS = ['src/assets/sprites/', 'src/assets/audio/', 'src/assets/effects/'];
export const PROHIBITED_NAME_PATTERN = /donkey-kong|nintendo|mario|dk-rip|(^|[^a-z])dk([^a-z]|$)|ripped|(^|[^a-z])rom([^a-z]|$)|sprite-rip|copied|sample-pack/i;

export function hasProhibitedAssetName(path) {
  const fileName = String(path).split('/').pop();
  return PROHIBITED_NAME_PATTERN.test(fileName) || PROHIBITED_NAME_PATTERN.test(String(path));
}

export function validateAssetRegister(register) {
  const errors = [];
  for (const field of ['version', 'dataClassification', 'lastReviewed', 'requiredAssets', 'legalBoundaryNotes']) {
    if (!(field in (register ?? {}))) errors.push(`missing top-level field ${field}`);
  }
  const items = Array.isArray(register?.requiredAssets) ? register.requiredAssets : [];
  const seen = new Set();
  items.forEach((item, index) => {
    const at = `requiredAssets[${index}]`;
    for (const field of REGISTER_ITEM_FIELDS) {
      if (!(field in item)) errors.push(`${at} missing field ${field}`);
    }
    if (seen.has(item.id)) errors.push(`${at} duplicate id ${item.id}`);
    seen.add(item.id);
    if (item.copiedAssetProhibited !== true) errors.push(`${at} copiedAssetProhibited must be true`);
    if (!ORIGINALITY_STATUSES.includes(item.originalityStatus)) errors.push(`${at} invalid originalityStatus ${item.originalityStatus}`);
    if (!REVIEW_STATUSES.includes(item.reviewStatus)) errors.push(`${at} invalid reviewStatus ${item.reviewStatus}`);
    if (hasProhibitedAssetName(item.intendedPath ?? '')) errors.push(`${at} intendedPath uses a prohibited name`);
  });
  for (const id of REQUIRED_ASSET_IDS) {
    if (!seen.has(id)) errors.push(`missing required asset ${id}`);
  }
  return errors;
}

export function listManifestEntries(manifest) {
  return [...(manifest?.sprites ?? []), ...(manifest?.audio ?? []), ...(manifest?.effects ?? [])];
}

export function validateAssetManifest(manifest, { fileExists, register } = {}) {
  const errors = [];
  for (const field of ['version', 'criticalStartupKeys', 'sprites', 'audio', 'effects', 'manifestNotes']) {
    if (!(field in (manifest ?? {}))) errors.push(`missing top-level field ${field}`);
  }
  const entries = listManifestEntries(manifest);
  const keys = new Map();
  for (const entry of entries) {
    keys.set(entry.key, (keys.get(entry.key) ?? 0) + 1);
    if (!MANIFEST_TYPES.includes(entry.type)) errors.push(`${entry.key} has unsupported type ${entry.type}`);
    if (!ALLOWED_ASSET_ROOTS.some((root) => String(entry.path).startsWith(root))) {
      errors.push(`${entry.key} path ${entry.path} is outside the allowed asset folders`);
    }
    if (hasProhibitedAssetName(entry.path ?? '')) errors.push(`${entry.key} path uses a prohibited name`);
    if (fileExists && !fileExists(entry.path)) errors.push(`${entry.key} file not found: ${entry.path}`);
  }
  for (const [key, count] of keys) {
    if (count > 1) errors.push(`duplicate manifest key ${key}`);
  }
  for (const key of manifest?.criticalStartupKeys ?? []) {
    const matches = entries.filter((entry) => entry.key === key);
    if (matches.length !== 1) errors.push(`critical startup key ${key} resolves to ${matches.length} entries`);
    else if (matches[0].preload !== true) errors.push(`critical startup key ${key} must have preload true`);
  }
  if (register) {
    const registerIds = new Set((register.requiredAssets ?? []).map((item) => item.id));
    for (const entry of entries) {
      if (!registerIds.has(entry.registerId)) errors.push(`${entry.key} registerId ${entry.registerId} is not in the asset register`);
    }
  }
  return errors;
}
