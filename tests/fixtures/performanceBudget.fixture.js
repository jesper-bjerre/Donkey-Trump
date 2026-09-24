const MB = 1024 * 1024;
export const underBudget = [
  { path: 'assets/phaser.js', bytes: 1.2 * MB, gzipBytes: 0.32 * MB },
  { path: 'assets/index.js', bytes: 60 * 1024, gzipBytes: 18 * 1024 },
  { path: 'index.html', bytes: 1200, gzipBytes: 600 },
];
export const overBudget = [
  { path: 'assets/phaser.js', bytes: 1.2 * MB, gzipBytes: 0.32 * MB },
  { path: 'assets/huge-intro-video.webm', bytes: 12 * MB, gzipBytes: 6 * MB },
];
export const overUncompressedOnly = [{ path: 'assets/level-art.png', bytes: 21 * MB, gzipBytes: 4 * MB }];
