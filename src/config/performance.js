// Release budgets from the architecture NFRs.
export const PERFORMANCE_BUDGETS = Object.freeze({
  // Critical startup payload (everything the title screen needs), gzip-compressed.
  startupCompressedBytes: 5 * 1024 * 1024,
  // Total uncompressed static artifact.
  artifactUncompressedBytes: 20 * 1024 * 1024,
  minimumGameplayFps: 45,
  targetFps: 60,
  titleReadyMs: 5000,
});
