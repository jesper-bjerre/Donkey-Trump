// Release QA panel proving analytics is disabled and privacy-minimized.
import { ANALYTICS_ENABLED, ANALYTICS_EVENTS, trackAnalyticsEvent } from '../analytics/AnalyticsAdapter.js';
import { el } from './dom.js';

export function runAnalyticsDisabledChecks() {
  const probe = trackAnalyticsEvent(ANALYTICS_EVENTS.SESSION_START, { inputType: 'keyboard', email: 'probe@example.invalid' });
  const rejected = trackAnalyticsEvent('free_form_note', { message: 'probe' });
  return [
    { id: 'disabled', label: 'Analytics transport is disabled', passed: ANALYTICS_ENABLED === false },
    { id: 'not-sent', label: 'Allowed events are accepted but never sent', passed: probe.accepted === true && probe.sent === false },
    { id: 'pii-stripped', label: 'PII-like payload fields are stripped', passed: !('email' in (probe.payload ?? {})) },
    { id: 'allow-list', label: 'Unknown event names are rejected', passed: rejected.accepted === false },
  ];
}

export function AnalyticsDisabledChecklist() {
  const checks = runAnalyticsDisabledChecks();
  return el('section', { 'aria-labelledby': 'analytics-heading', 'data-panel': 'analytics' }, [
    el('h2', { id: 'analytics-heading', text: 'Analytics disabled checklist' }),
    el('ul', {}, checks.map((check) => el('li', { 'data-check': check.id, text: `${check.passed ? 'PASS' : 'FAIL'}: ${check.label}` }))),
    el('p', { text: `Allow-listed candidate events: ${Object.values(ANALYTICS_EVENTS).join(', ')}.` }),
  ]);
}
