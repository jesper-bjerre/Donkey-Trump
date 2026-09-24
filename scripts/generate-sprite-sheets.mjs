// Generates the original animation sprite sheets under src/assets/sprites.
// Every shape is drawn here from primitives; nothing is traced or copied.
// Run: node scripts/generate-sprite-sheets.mjs
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(import.meta.dirname, '../src/assets/sprites');
// Frames are drawn in design units (frameWidth x frameHeight) and rasterized at
// `scale`, so a bigger on-screen sprite stays crisp instead of being upscaled.
const sheet = (frameWidth, frameHeight, frames, note, scale = 1) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${frameWidth * frames.length * scale}" height="${frameHeight * scale}" viewBox="0 0 ${frameWidth * frames.length} ${frameHeight}">\n` +
  `  <!-- ${note} -->\n` +
  frames.map((frame, i) => `  <g transform="translate(${i * frameWidth} 0)">${frame}</g>`).join('\n') +
  '\n</svg>\n';

// Jumpman Løkke, 24x32: idle, walk A, walk B, jump, climb A, climb B, hit.
const SKIN = '#f1c7a3';
const SUIT = '#1f2d52';
const TROUSERS = '#17213d';
const lokkeHead = (eyes = 'glasses') => `
    <ellipse cx="12" cy="6.5" rx="5.6" ry="6" fill="${SKIN}"/>
    <path d="M6.4 5.2 C6.8 1.8 9 0.6 12 0.6 C15 0.6 17.2 1.8 17.6 5.2 C16.6 3.6 15.6 3 14.6 3.1 C13 2.4 11 2.4 9.4 3.1 C8.4 3 7.4 3.6 6.4 5.2 Z" fill="#8a8f98"/>
    ${
      eyes === 'x'
        ? '<path d="M8.6 5.4 L11 7.8 M11 5.4 L8.6 7.8 M13 5.4 L15.4 7.8 M15.4 5.4 L13 7.8" stroke="#222" stroke-width="0.9"/><ellipse cx="12" cy="10.4" rx="1.4" ry="1" fill="#8a3b2c"/>'
        : '<circle cx="9.8" cy="6.6" r="1.7" fill="none" stroke="#222" stroke-width="0.7"/><circle cx="14.2" cy="6.6" r="1.7" fill="none" stroke="#222" stroke-width="0.7"/><line x1="11.5" y1="6.6" x2="12.5" y2="6.6" stroke="#222" stroke-width="0.7"/><path d="M10.2 10 Q12 11.4 13.8 10" fill="none" stroke="#8a3b2c" stroke-width="0.8" stroke-linecap="round"/>'
    }`;
const lokkeTorso = `
    <path d="M4 13.5 Q12 11 20 13.5 L20.6 23.5 H3.4 Z" fill="${SUIT}"/>
    <path d="M10 12.2 L12 16.8 L14 12.2 Z" fill="#a9c9ef"/>
    <path d="M11.4 13.4 L12 20 L12.6 13.4 Z" fill="#2c7a3f"/>`;
const arm = (x, y, angle) => `<g transform="rotate(${angle} ${x + 1.5} ${y})"><rect x="${x}" y="${y}" width="3" height="8" rx="1.4" fill="${SUIT}"/><circle cx="${x + 1.5}" cy="${y + 8.6}" r="1.4" fill="${SKIN}"/></g>`;
const leg = (x, angle) => `<g transform="rotate(${angle} ${x + 2.8} 23.4)"><rect x="${x}" y="23.4" width="5.6" height="7" fill="${TROUSERS}"/><rect x="${x - 1.2}" y="30" width="7.2" height="2" rx="1" fill="#111"/></g>`;
const lokke = ({ arms = [0, 0], armY = [14, 14], legs = [0, 0], eyes, tilt = 0 } = {}) =>
  `<g transform="rotate(${tilt} 12 16)">${arm(1.6, armY[0], arms[0])}${arm(19.4, armY[1], arms[1])}${leg(5, legs[0])}${leg(13.4, legs[1])}${lokkeTorso}${lokkeHead(eyes)}</g>`;
const playerFrames = [
  lokke(),
  lokke({ arms: [25, -25], legs: [22, -22] }),
  lokke({ arms: [-25, 25], legs: [-22, 22] }),
  lokke({ arms: [150, -150], armY: [15, 15], legs: [35, -35] }),
  lokke({ arms: [180, 0], armY: [13, 14], legs: [0, 12] }),
  lokke({ arms: [0, 180], armY: [14, 13], legs: [-12, 0] }),
  lokke({ arms: [120, -120], legs: [18, -18], eyes: 'x', tilt: -14 }),
];

// Trump-inspired boss, 72x72: idle, angry, throw.
const bossBody = `
    <path d="M8 46 Q36 34 64 46 L67 72 H5 Z" fill="#1d2a4d"/>
    <path d="M29 38 L36 50 L43 38 Z" fill="#ffffff"/>
    <path d="M33.4 41 L36 70 L38.6 41 Z" fill="#d11f2f"/>
    <path d="M33 39.5 H39 L37.8 43 H34.2 Z" fill="#a01522"/>`;
const bossArms = (raised) =>
  raised
    ? `<path d="M10 48 Q4 30 14 14" stroke="#1d2a4d" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M62 48 Q68 30 58 14" stroke="#1d2a4d" stroke-width="8" stroke-linecap="round" fill="none"/>
    <circle cx="14" cy="12" r="4" fill="#f09a4f"/><circle cx="58" cy="12" r="4" fill="#f09a4f"/>`
    : `<path d="M6 48 Q1 56 4 66" stroke="#1d2a4d" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M66 48 Q71 56 68 66" stroke="#1d2a4d" stroke-width="8" stroke-linecap="round" fill="none"/>
    <circle cx="4.5" cy="67" r="4" fill="#f09a4f"/><circle cx="67.5" cy="67" r="4" fill="#f09a4f"/>`;
const bossHead = ({ brow = 0, mouthRy = 3 } = {}) => `
    <ellipse cx="36" cy="25" rx="15" ry="15.5" fill="#f09a4f"/>
    <ellipse cx="29.2" cy="24.2" rx="3.6" ry="2.4" fill="#f7d7b0"/>
    <ellipse cx="42.8" cy="24.2" rx="3.6" ry="2.4" fill="#f7d7b0"/>
    <circle cx="29.8" cy="24.6" r="1.3" fill="#1a1a1a"/>
    <circle cx="42.2" cy="24.6" r="1.3" fill="#1a1a1a"/>
    <path d="M24 ${19.5 + brow} L33 ${22 + brow}" stroke="#e8c14a" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M48 ${19.5 + brow} L39 ${22 + brow}" stroke="#e8c14a" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="36" cy="34" rx="4.6" ry="${mouthRy}" fill="#7a1f24"/>
    <ellipse cx="36" cy="${34 - mouthRy + 0.8}" rx="3.2" ry="1.1" fill="#ffffff"/>
    <path d="M19 20 C17 8 26 3 38 4 C50 5 57 10 55 18 C51 12 44 10.5 36 11.5 C28 12.5 22 15 19 20 Z" fill="#f2cf4a"/>
    <path d="M55 18 C58 15 60 12 58.5 9.5 C57 11 55.5 12 53.5 12.5 Z" fill="#f2cf4a"/>
    <path d="M24 13.5 C31 9.5 41 8.6 50 11" stroke="#d9b233" stroke-width="1.2" fill="none"/>`;
const steam = '<path d="M11 6 L14 11 M61 6 L58 11 M36 0.5 V3" stroke="#ff4d4d" stroke-width="1.6" stroke-linecap="round"/>';
const bossFrames = [
  `${bossBody}${bossArms(false)}${bossHead()}`,
  `${bossBody}${bossArms(false)}${bossHead({ brow: 1.6, mouthRy: 4.2 })}${steam}`,
  `${bossBody}${bossArms(true)}${bossHead({ brow: 1.6, mouthRy: 4.6 })}${steam}`,
];

// Barrel seen end-on, 18x18: four roll frames.
const barrelFrame = (angle) => `
    <circle cx="9" cy="9" r="8.6" fill="#9b6531" stroke="#4a2c12" stroke-width="1.2"/>
    <circle cx="9" cy="9" r="5.4" fill="none" stroke="#c9d1d9" stroke-width="1.3"/>
    <g transform="rotate(${angle} 9 9)"><path d="M9 1.2 V16.8 M1.2 9 H16.8" stroke="#6b421d" stroke-width="1.4"/></g>
    <circle cx="9" cy="9" r="1.6" fill="#4a2c12"/>`;
const barrelFrames = [0, 22.5, 45, 67.5].map(barrelFrame);

// Motzfeldt, 28x44: wave A, wave B, rescued (both arms up with a heart).
const motzfeldt = ({ leftArm, rightArm, heart = false }) => `
    <path d="M6.5 9 C6 2.5 10 0.5 14 0.5 C18 0.5 22 2.5 21.5 9 L22.5 17 H5.5 Z" fill="#23201f"/>
    <ellipse cx="14" cy="8.6" rx="5.4" ry="6" fill="#dcb08c"/>
    <path d="M8.6 5.6 C10.5 3 17.5 3 19.4 5.6 C17 4.6 11 4.6 8.6 5.6 Z" fill="#23201f"/>
    <circle cx="11.9" cy="8.4" r="0.8" fill="#222"/><circle cx="16.1" cy="8.4" r="0.8" fill="#222"/>
    ${heart ? '<path d="M11.6 11.4 Q14 13.6 16.4 11.4" stroke="#9c2d3a" stroke-width="1" fill="none"/>' : '<ellipse cx="14" cy="12" rx="1.6" ry="1.1" fill="#9c2d3a"/>'}
    <path d="M6 17 Q14 14.5 22 17 L24.5 36 H3.5 Z" fill="#ffffff"/>
    <path d="M5 26 H23 L24.5 36 H3.5 Z" fill="#c8102e"/>
    <circle cx="14" cy="26" r="4.2" fill="#c8102e"/>
    <path d="M9.8 26 A4.2 4.2 0 0 0 18.2 26 Z" fill="#ffffff"/>
    <path d="M22 18 L${rightArm[0]} ${rightArm[1]}" stroke="#dcb08c" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M6 18 L${leftArm[0]} ${leftArm[1]}" stroke="#dcb08c" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="8.5" y="36" width="3.5" height="7" fill="#3a2a22"/><rect x="16" y="36" width="3.5" height="7" fill="#3a2a22"/>
    ${heart ? '<path d="M3 3.5 A1.6 1.6 0 0 1 6 3.5 A1.6 1.6 0 0 1 9 3.5 Q9 5.6 6 7.6 Q3 5.6 3 3.5 Z" fill="#ff5a7a"/>' : ''}`;
const rescueFrames = [
  motzfeldt({ leftArm: [3.5, 27], rightArm: [26.5, 9] }),
  motzfeldt({ leftArm: [3.5, 27], rightArm: [25, 5] }),
  motzfeldt({ leftArm: [2.5, 9], rightArm: [25.5, 9], heart: true }),
];

const files = {
  // Jumpman is drawn at 1.5x (36x48 frames) so he reads clearly next to the girders.
  'player-jumpman-lokke-sheet.svg': sheet(24, 32, playerFrames, 'Original Jumpman Løkke sheet: idle, walk A, walk B, jump, climb A, climb B, hit.', 1.5),
  'boss-trump-inspired-sheet.svg': sheet(72, 72, bossFrames, 'Original Trump-inspired boss sheet: idle, angry, throw.'),
  'barrel-original-sheet.svg': sheet(18, 18, barrelFrames, 'Original barrel roll sheet: four rotation frames.'),
  'rescue-motzfeldt-sheet.svg': sheet(28, 44, rescueFrames, 'Original Motzfeldt sheet: wave A, wave B, rescued.'),
};
for (const [name, svg] of Object.entries(files)) fs.writeFileSync(path.join(OUT, name), svg);
console.log(`Wrote ${Object.keys(files).length} sheets to ${OUT}`);
