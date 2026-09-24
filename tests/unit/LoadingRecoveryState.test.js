import { describe, expect, it } from 'vitest';
import { RECOVERY_REASONS, getLoadingRecoveryState } from '../../src/ui/LoadingRecoveryState.js';

describe('getLoadingRecoveryState', () => {
  it('accepts the two recovery reasons', () => {
    expect(Object.values(RECOVERY_REASONS)).toEqual(['unsupported-browser', 'asset-failure']);
  });

  it('explains unsupported browsers: modern desktop browser, Canvas or WebGL, keyboard', () => {
    const state = getLoadingRecoveryState('unsupported-browser');
    expect(state.reason).toBe('unsupported-browser');
    expect(state.message).toMatch(/modern desktop browser/);
    expect(state.message).toMatch(/Canvas or WebGL/);
    expect(state.message).toMatch(/keyboard/);
    expect(state.title).toBeTruthy();
  });

  it('explains asset failures with a reload action and no stack trace', () => {
    const state = getLoadingRecoveryState('asset-failure');
    expect(state.message).toMatch(/game files/i);
    expect(state.primaryActionLabel).toMatch(/reload/i);
    expect(JSON.stringify(state)).not.toMatch(/Error|at \S+\.js|stack/);
  });

  it('falls back to asset-failure for unknown reasons', () => {
    expect(getLoadingRecoveryState('mystery').reason).toBe('asset-failure');
  });
});
