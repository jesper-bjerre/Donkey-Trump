import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ANALYTICS_ENABLED,
  ANALYTICS_EVENTS,
  isAllowedAnalyticsEvent,
  sanitizeAnalyticsPayload,
  toScoreBand,
  trackAnalyticsEvent,
} from '../../src/analytics/AnalyticsAdapter.js';
import * as fx from '../fixtures/analyticsEvents.fixture.js';

afterEach(() => vi.restoreAllMocks());

describe('allow-list', () => {
  it('exports exactly the approved event names', () => {
    expect(Object.values(ANALYTICS_EVENTS).sort()).toEqual(
      ['input_used', 'level_complete', 'level_start', 'player_death', 'session_start', 'victory_complete'],
    );
    for (const event of fx.allowed) expect(isAllowedAnalyticsEvent(event.name)).toBe(true);
    for (const name of fx.rejectedNames) expect(isAllowedAnalyticsEvent(name)).toBe(false);
  });
});

describe('trackAnalyticsEvent', () => {
  it('accepts level_start as a no-op without any network call', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve());
    const beacon = vi.fn();
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    const result = trackAnalyticsEvent('level_start', { level: 1, lives: 3, scoreBand: '0-999', inputType: 'keyboard' });
    expect(result).toMatchObject({ accepted: true, sent: false });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    expect(ANALYTICS_ENABLED).toBe(false);
  });

  it('rejects free-form events without throwing', () => {
    expect(() => trackAnalyticsEvent('free_form_note', { message: 'hello' })).not.toThrow();
    expect(trackAnalyticsEvent('free_form_note', { message: 'hello' })).toMatchObject({ accepted: false, sent: false });
  });

  it('never throws on malformed payloads', () => {
    for (const payload of [null, 'text', [1, 2], { level: Number.NaN }]) {
      expect(() => trackAnalyticsEvent('level_start', payload)).not.toThrow();
    }
  });
});

describe('sanitizeAnalyticsPayload', () => {
  it('strips PII-like extra fields', () => {
    const { payload, dropped } = sanitizeAnalyticsPayload(fx.withPii.payload);
    expect(payload).toEqual({ level: 1, lives: 2, cause: 'barrel' });
    expect(dropped).toEqual(expect.arrayContaining(['email', 'name', 'userId', 'ip']));
  });

  it('drops values outside numeric and format bounds', () => {
    expect(sanitizeAnalyticsPayload(fx.outOfBounds.payload).payload).toEqual({});
  });

  it('bands scores coarsely', () => {
    expect(toScoreBand(0)).toBe('0-999');
    expect(toScoreBand(4500)).toBe('4000-4999');
    expect(toScoreBand(25000)).toBe('10000+');
  });
});

describe('source hygiene', () => {
  it('references no transport, storage or cookie APIs', () => {
    const source = fs.readFileSync(path.resolve(import.meta.dirname, '../../src/analytics/AnalyticsAdapter.js'), 'utf8');
    expect(source).not.toMatch(/fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie|^import /m);
  });
});
