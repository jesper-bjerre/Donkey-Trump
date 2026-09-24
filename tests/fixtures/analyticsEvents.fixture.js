export const allowed = [
  { name: 'session_start', payload: { inputType: 'keyboard' } },
  { name: 'level_start', payload: { level: 1, lives: 3, scoreBand: '0-999', inputType: 'keyboard' } },
  { name: 'player_death', payload: { level: 2, lives: 1, cause: 'barrel' } },
  { name: 'input_used', payload: { inputType: 'keyboard', level: 1 } },
  { name: 'level_complete', payload: { level: 1, lives: 2, scoreBand: '1000-1999' } },
  { name: 'victory_complete', payload: { level: 3, lives: 2, scoreBand: '10000+' } },
];

export const rejectedNames = ['free_form_note', 'LEVEL_START', '', null, 42];

export const withPii = {
  name: 'player_death',
  payload: { level: 1, lives: 2, cause: 'barrel', email: 'player@example.com', name: 'Player One', userId: 'abc-123', ip: '203.0.113.9' },
};

export const outOfBounds = { name: 'level_start', payload: { level: 0, lives: -1, scoreBand: 'lots', inputType: 'gamepad' } };
