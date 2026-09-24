// Disabled-by-design analytics seam. Accepts only allow-listed, privacy-minimized
// gameplay events and drops them locally: there is no transport, no identifier
// and no storage in the MVP. Never throws into gameplay callers.

export const ANALYTICS_EVENTS = Object.freeze({
  SESSION_START: 'session_start',
  LEVEL_START: 'level_start',
  PLAYER_DEATH: 'player_death',
  INPUT_USED: 'input_used',
  LEVEL_COMPLETE: 'level_complete',
  VICTORY_COMPLETE: 'victory_complete',
});

const ALLOWED_EVENT_NAMES = new Set(Object.values(ANALYTICS_EVENTS));

// Every permitted payload field with its validator. Anything else is stripped.
const PAYLOAD_RULES = {
  level: (value) => Number.isInteger(value) && value >= 1 && value <= 99,
  lives: (value) => Number.isInteger(value) && value >= 0 && value <= 99,
  scoreBand: (value) => typeof value === 'string' && /^\d{1,7}-\d{1,7}\+?$|^\d{1,7}\+$/.test(value),
  inputType: (value) => value === 'keyboard',
  cause: (value) => value === 'barrel' || value === 'fall',
};

export const ANALYTICS_ENABLED = false;

export function isAllowedAnalyticsEvent(name) {
  return typeof name === 'string' && ALLOWED_EVENT_NAMES.has(name);
}

export function toScoreBand(score) {
  const band = Math.floor(Math.max(0, score) / 1000) * 1000;
  return band >= 10000 ? '10000+' : `${band}-${band + 999}`;
}

export function sanitizeAnalyticsPayload(payload) {
  const clean = {};
  const dropped = [];
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    for (const [key, value] of Object.entries(payload)) {
      if (PAYLOAD_RULES[key]?.(value)) clean[key] = value;
      else dropped.push(key);
    }
  }
  return { payload: clean, dropped };
}

export function trackAnalyticsEvent(name, payload = {}) {
  try {
    if (!isAllowedAnalyticsEvent(name)) {
      return { accepted: false, sent: false, reason: 'event-not-allowed' };
    }
    const { payload: clean, dropped } = sanitizeAnalyticsPayload(payload);
    // Transport is intentionally absent while ANALYTICS_ENABLED is false.
    return { accepted: true, sent: false, event: name, payload: clean, dropped };
  } catch {
    return { accepted: false, sent: false, reason: 'error' };
  }
}
