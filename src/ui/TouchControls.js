// On-screen handheld-style controls for touch devices: a D-pad on the left, a big
// JUMP button and START / PAUSE / SOUND buttons on the right. Presses become
// keyboard events via VirtualKeyboard. In portrait orientation the game pauses and
// asks the player to turn the device, because the game is played in landscape.
import uiText from '../config/uiText.en.json';
import { VirtualKeyboard } from '../input/virtualKeys.js';
import { isPortrait } from '../input/deviceDetection.js';
import { announce } from './announce.js';
import { el } from './dom.js';

export const DPAD_ACTIONS = Object.freeze(['left', 'right', 'up', 'down']);
const DEAD_ZONE = 0.22;

// Capture keeps a drag bound to its control, but a pointer that already ended
// makes it throw; the press itself must still register.
function capturePointer(element, pointerId) {
  try {
    element.setPointerCapture?.(pointerId);
  } catch {
    // Pointer no longer active.
  }
}
const AXIS_THRESHOLD = 0.38;

// Maps a touch offset from the D-pad center to held directions. Diagonals hold two
// directions, so the player can walk and climb in one motion.
export function directionsFromPoint(dx, dy, radius) {
  const nx = dx / radius;
  const ny = dy / radius;
  if (Math.hypot(nx, ny) < DEAD_ZONE) return [];
  const directions = [];
  if (nx <= -AXIS_THRESHOLD) directions.push('left');
  if (nx >= AXIS_THRESHOLD) directions.push('right');
  if (ny <= -AXIS_THRESHOLD) directions.push('up');
  if (ny >= AXIS_THRESHOLD) directions.push('down');
  return directions;
}

function DirectionPad(keyboard) {
  const labels = uiText.touch.dpad;
  const arms = DPAD_ACTIONS.map((direction) =>
    el('span', { class: `dpad-arm dpad-${direction}`, 'data-direction': direction, 'aria-hidden': 'true' }, el('span', { class: 'dpad-arrow' })),
  );
  const pad = el('div', { class: 'dpad', role: 'group', 'aria-label': labels.label, 'data-control': 'dpad' }, [...arms, el('span', { class: 'dpad-hub', 'aria-hidden': 'true' })]);
  const pointers = new Map();

  const sync = () => {
    const held = new Set([...pointers.values()].flat());
    keyboard.setHeld([...held], DPAD_ACTIONS);
    for (const arm of arms) arm.classList.toggle('is-pressed', held.has(arm.dataset.direction));
  };
  const track = (event) => {
    const rect = pad.getBoundingClientRect();
    const radius = rect.width / 2 || 1;
    pointers.set(event.pointerId, directionsFromPoint(event.clientX - rect.left - radius, event.clientY - rect.top - rect.height / 2, radius));
    sync();
  };
  const untrack = (event) => {
    pointers.delete(event.pointerId);
    sync();
  };

  pad.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    capturePointer(pad, event.pointerId);
    track(event);
  });
  pad.addEventListener('pointermove', (event) => {
    if (pointers.has(event.pointerId)) track(event);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(type, untrack);

  // Screen-reader and switch users get one discrete button per direction.
  const accessible = el(
    'div',
    { class: 'visually-hidden' },
    DPAD_ACTIONS.map((direction) =>
      el('button', { type: 'button', 'data-action': direction, text: labels[direction], onClick: () => keyboard.tap(direction) }),
    ),
  );
  return el('div', { class: 'dpad-wrap' }, [pad, accessible, el('span', { class: 'deck-label', 'aria-hidden': 'true', text: labels.caption })]);
}

// Holds the key while the finger is down; keyboard activation (Enter/Space on a
// focused button, detail 0) sends a quick tap instead.
function HoldButton(keyboard, action, label, className) {
  const button = el('button', { type: 'button', class: className, 'data-action': action, 'aria-label': label }, el('span', { text: label }));
  const release = () => {
    keyboard.release(action);
    button.classList.remove('is-pressed');
  };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    capturePointer(button, event.pointerId);
    keyboard.press(action);
    button.classList.add('is-pressed');
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, release);
  button.addEventListener('click', (event) => {
    if (event.detail === 0) keyboard.tap(action);
  });
  return button;
}

function requestLandscapeFullscreen(doc) {
  const root = doc.documentElement;
  if (!root.requestFullscreen) return Promise.resolve(false);
  return root
    .requestFullscreen({ navigationUI: 'hide' })
    .then(() => doc.defaultView?.screen?.orientation?.lock?.('landscape'))
    .then(() => true)
    .catch(() => false);
}

export function mountTouchControls({ doc = globalThis.document, keyboard = new VirtualKeyboard({ target: doc.defaultView }) } = {}) {
  const labels = uiText.touch.buttons;
  const host = doc.getElementById('game');
  if (!host) throw new Error('Touch controls need the #game container.');

  doc.documentElement.classList.add('touch-mode');
  const help = doc.getElementById('game-help');
  if (help) help.textContent = uiText.touch.help;

  const systemButtons = [
    HoldButton(keyboard, 'confirm', labels.start, 'deck-button'),
    HoldButton(keyboard, 'pause', labels.pause, 'deck-button'),
    HoldButton(keyboard, 'mute', labels.sound, 'deck-button'),
  ];
  if (doc.fullscreenEnabled) {
    systemButtons.push(
      el('button', { type: 'button', class: 'deck-button', 'data-action': 'fullscreen', text: labels.fullscreen, onClick: () => requestLandscapeFullscreen(doc) }),
    );
  }

  const left = el('div', { class: 'deck deck-left', 'data-control': 'deck-left' }, DirectionPad(keyboard));
  const right = el('div', { class: 'deck deck-right', 'data-control': 'deck-right' }, [
    el('div', { class: 'deck-system' }, systemButtons),
    HoldButton(keyboard, 'jump', labels.jump, 'jump-button'),
  ]);
  const screen = el('div', { class: 'handheld-screen' });
  const handheld = el('div', { class: 'handheld', 'data-control': 'handheld' }, [left, screen, right]);
  host.replaceWith(handheld);
  screen.append(host);

  const rotate = el('div', { class: 'rotate-hint', role: 'alert', hidden: '' }, [
    el('span', { class: 'rotate-icon', 'aria-hidden': 'true' }),
    el('p', { text: uiText.touch.rotate }),
  ]);
  handheld.after(rotate);

  const win = doc.defaultView;
  let game = null;
  const applyOrientation = () => {
    const portrait = isPortrait(win);
    rotate.hidden = !portrait;
    handheld.toggleAttribute('inert', portrait);
    if (portrait) {
      keyboard.releaseAll();
      game?.pause?.();
      announce(uiText.touch.rotate, doc);
    } else {
      game?.resume?.();
    }
  };
  win?.matchMedia?.('(orientation: portrait)')?.addEventListener?.('change', applyOrientation);
  applyOrientation();

  // Stop long-press menus and stray scrolling while playing.
  handheld.addEventListener('contextmenu', (event) => event.preventDefault());
  win?.addEventListener?.('blur', () => keyboard.releaseAll());

  return {
    handheld,
    keyboard,
    applyOrientation,
    attachGame(nextGame) {
      game = nextGame;
      applyOrientation();
    },
  };
}
