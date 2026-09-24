// Release QA panel summarizing originality review status for every launch asset.
import assetRegister from '../assets/assetRegister.json';
import { validateAssetRegister } from '../assets/assetValidation.js';
import { el } from './dom.js';

export function summarizeAssetRegister(register = assetRegister) {
  const counts = {};
  for (const item of register.requiredAssets) counts[item.reviewStatus] = (counts[item.reviewStatus] ?? 0) + 1;
  const problems = validateAssetRegister(register);
  const pendingReview = register.requiredAssets.filter((item) => item.reviewStatus !== 'approved').map((item) => item.id);
  return { counts, problems, pendingReview, launchReady: problems.length === 0 && pendingReview.length === 0 };
}

export function AssetRegisterPanel(register = assetRegister) {
  const summary = summarizeAssetRegister(register);
  const rows = register.requiredAssets.map((item) =>
    el('tr', {}, [
      el('th', { scope: 'row', text: item.id }),
      el('td', { text: item.displayName }),
      el('td', {}, el('code', { text: item.intendedPath })),
      el('td', { text: item.originalityStatus }),
      el('td', { text: item.reviewStatus }),
    ]),
  );
  return el('section', { 'aria-labelledby': 'asset-register-heading', 'data-panel': 'asset-register' }, [
    el('h2', { id: 'asset-register-heading', text: 'Asset originality register' }),
    el('p', {
      text: summary.launchReady
        ? 'All launch assets are approved.'
        : `Not launch-ready: ${summary.pendingReview.length} asset(s) still need originality review.`,
    }),
    summary.problems.length ? el('ul', {}, summary.problems.map((problem) => el('li', { text: problem }))) : null,
    el('div', { class: 'table-wrap' }, [
      el('table', {}, [
        el('caption', { text: 'Required launch assets' }),
        el('thead', {}, el('tr', {}, ['Id', 'Name', 'Path', 'Originality', 'Review'].map((label) => el('th', { scope: 'col', text: label })))),
        el('tbody', {}, rows),
      ]),
    ]),
  ]);
}
