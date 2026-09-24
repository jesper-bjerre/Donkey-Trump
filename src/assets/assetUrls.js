// Files under src/ are only emitted to dist when imported, so glob them as URLs
// and key them by their repository-relative path used in assetManifest.json.
const modules = import.meta.glob('./{sprites,effects,audio}/*.{svg,png,webp,ogg,wav,json}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const urlByPath = Object.fromEntries(
  Object.entries(modules).map(([relative, url]) => [`src/assets/${relative.slice(2)}`, url]),
);

export function resolveAssetUrl(manifestPath) {
  return urlByPath[manifestPath] ?? null;
}
