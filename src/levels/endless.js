// Endless mode: the authored layouts repeat forever and every cleared level makes
// the barrels faster, more frequent and more often hurled. After the first loop,
// difficulty grows from the hardest authored level, so each level is harder than
// the one before even though the layouts start over. Each value approaches a fair
// limit asymptotically (each level closes a fixed share of the remaining gap), so
// it keeps rising on every level without ever becoming unplayable. The player's
// own speed never changes.

export const DIFFICULTY_RAMP = Object.freeze({
  // Share of the remaining gap to each limit that is kept per cleared level.
  retainPerLevel: 0.92,
  // Limits: the fastest barrel still covers less ground than a full jump spans.
  speedMaxLimit: 280,
  speedMinLimit: 240,
  spawnIntervalLimitMs: 800,
  directThrowChanceLimit: 0.55,
  // One more barrel allowed on screen every second level, up to this cap.
  maxActiveCap: 12,
});

const round = (value) => Math.round(value * 100) / 100;

// start -> limit, closing (1 - retain) of the remaining gap each level.
function approach(start, limit, retain, levels) {
  return limit + (start - limit) * retain ** levels;
}

// Returns the playable level for a 0-based index: layout index % layouts, with
// difficulty ramped by how many levels were cleared before it.
export function createEndlessLevel(layouts, index, ramp = DIFFICULTY_RAMP) {
  const base = layouts[index % layouts.length];
  const loop = Math.floor(index / layouts.length);
  const cleared = Math.max(0, index - (layouts.length - 1));
  const hardest = layouts[layouts.length - 1].barrels;
  const tuning = cleared === 0 ? base.barrels : hardest;
  const r = ramp.retainPerLevel;
  return {
    ...base,
    id: loop === 0 ? base.id : `${base.id}-loop-${loop + 1}`,
    order: index + 1,
    difficulty: { tier: index + 1, label: loop === 0 ? base.difficulty.label : `${base.difficulty.label} +${loop}` },
    barrels: {
      ...base.barrels,
      speedMin: round(approach(tuning.speedMin, ramp.speedMinLimit, r, cleared)),
      speedMax: round(approach(tuning.speedMax, ramp.speedMaxLimit, r, cleared)),
      spawnIntervalMs: Math.round(approach(tuning.spawnIntervalMs, ramp.spawnIntervalLimitMs, r, cleared)),
      maxActive: Math.min(ramp.maxActiveCap, (tuning.maxActive ?? 6) + Math.floor(cleared / 2)),
      route: {
        ...(base.barrels.route ?? {}),
        directThrowChance: round(approach(tuning.route?.directThrowChance ?? 0, ramp.directThrowChanceLimit, r, cleared)),
      },
    },
    // There is no last level in endless mode.
    rescue: { ...base.rescue, isFinalLevel: false },
  };
}
