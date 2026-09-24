// Synthesizes every game sound as a small 8-bit mono WAV file.
// All melodies are composed for this project, and all timbres come from pulse,
// triangle and noise oscillators. No samples, sample packs, or transcriptions of
// existing games are used.
// Run: node scripts/generate-feedback-audio.mjs
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(import.meta.dirname, '../src/assets/audio');
const RATE = 22050;

function wav(samples) {
  const data = Buffer.alloc(samples.length);
  samples.forEach((s, i) => {
    data[i] = Math.max(0, Math.min(255, Math.round(128 + s * 110)));
  });
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE, 28); // byte rate for 8-bit mono
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const NOTE_INDEX = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
export function noteToHz(note) {
  const match = /^([A-G]#?)(\d)$/.exec(note);
  if (!match) throw new Error(`Bad note ${note}`);
  const midi = (Number(match[2]) + 1) * 12 + NOTE_INDEX[match[1]];
  return 440 * 2 ** ((midi - 69) / 12);
}

let noiseSeed = 7;
const noise = () => {
  noiseSeed = (noiseSeed * 1103515245 + 12345) & 0x7fffffff;
  return (noiseSeed / 0x7fffffff) * 2 - 1;
};

const WAVES = {
  pulse: (phase, duty = 0.5) => (phase % 1 < duty ? 1 : -1),
  triangle: (phase) => 1 - 4 * Math.abs((phase % 1) - 0.5),
  noise: () => noise(),
};

// One voice: a list of [note | Hz | null (rest), beats] played at a tempo.
// Options: wave, duty, volume, attack/release in samples, slideTo (Hz, for single tones).
function voice(sequence, { bpm = 120, wave = 'pulse', duty = 0.5, volume = 0.5, release = 0.85 } = {}) {
  const out = [];
  const beat = 60 / bpm;
  let phase = 0;
  for (const [pitch, beats] of sequence) {
    const count = Math.round(beats * beat * RATE);
    const hz = pitch === null ? 0 : typeof pitch === 'number' ? pitch : noteToHz(pitch);
    const sustain = Math.round(count * release);
    for (let i = 0; i < count; i++) {
      if (!hz) {
        out.push(0);
        continue;
      }
      phase += hz / RATE;
      const env = Math.min(1, i / 40) * (i < sustain ? 1 - (0.35 * i) / sustain : Math.max(0, 1 - (i - sustain) / Math.max(1, count - sustain)) * 0.65);
      out.push(WAVES[wave](phase, duty) * env * volume);
    }
  }
  return out;
}

// A single tone whose pitch glides from `from` to `to` Hz.
function sweep(from, to, seconds, { wave = 'pulse', duty = 0.25, volume = 0.5, noiseMix = 0 } = {}) {
  const count = Math.round(seconds * RATE);
  const out = [];
  let phase = 0;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    phase += (from * (to / from) ** t) / RATE;
    const env = Math.min(1, i / 30) * (1 - t);
    out.push(((1 - noiseMix) * WAVES[wave](phase, duty) + noiseMix * noise()) * env * volume);
  }
  return out;
}

const mix = (...tracks) => {
  const length = Math.max(...tracks.map((t) => t.length));
  return Array.from({ length }, (_, i) => tracks.reduce((sum, t) => sum + (t[i] ?? 0), 0));
};
const concat = (...parts) => parts.flat();

// Legacy tone renderer kept so the original hit/retry/rescue cues stay unchanged.
function render(notes, { volume = 0.6 } = {}) {
  const out = [];
  noiseSeed = 7;
  for (const [frequency, duration] of notes) {
    const count = Math.round(duration * RATE);
    for (let i = 0; i < count; i++) {
      const t = i / RATE;
      const envelope = Math.min(1, i / 60) * (1 - i / count);
      const value = frequency === 'noise' ? noise() : Math.sign(Math.sin(2 * Math.PI * frequency * t));
      out.push(value * envelope * volume * (100 / 110));
    }
  }
  return out;
}

const sounds = {
  // --- Feedback cues ---
  'hit.wav': () => render([['noise', 0.08], [330, 0.07], [220, 0.08], [147, 0.14]]),
  'retry.wav': () => render([[392, 0.07], [523, 0.07], [659, 0.1]], { volume: 0.45 }),
  'rescue.wav': () => render([[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.2]], { volume: 0.45 }),

  // --- Movement and action effects ---
  // Soft two-tone footstep; the game alternates playback rate for left/right steps.
  'step.wav': () => sweep(260, 150, 0.035, { wave: 'triangle', volume: 0.55, noiseMix: 0.25 }),
  // Quick upward chirp with a narrow pulse for a springy jump.
  'jump.wav': () => sweep(330, 990, 0.13, { duty: 0.125, volume: 0.35 }),
  // Two bright blips when a barrel is cleared.
  'score.wav': () => voice([['E6', 0.12], ['B6', 0.2]], { bpm: 240, duty: 0.25, volume: 0.3 }),
  // Heavy downward thump when the boss hurls a barrel.
  'throw.wav': () => sweep(200, 55, 0.2, { volume: 0.5, noiseMix: 0.35 }),

  // --- Jingles (original compositions) ---
  // Level start: rising C-major call with a bouncing answer.
  'level-start.wav': () =>
    mix(
      voice([['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['C6', 1], ['A5', 0.5], ['B5', 0.5], ['C6', 1.5]], { bpm: 300, duty: 0.25, volume: 0.3 }),
      voice([['C3', 1.5], ['G2', 1.5], ['C3', 2]], { bpm: 300, wave: 'triangle', volume: 0.45 }),
    ),
  // Game over: slow chromatic slump settling on a low D.
  'game-over.wav': () =>
    mix(
      voice([['A4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['D#4', 1], ['D4', 3]], { bpm: 220, duty: 0.5, volume: 0.28, release: 0.7 }),
      voice([['D3', 2], ['A2', 2], ['D2', 4]], { bpm: 220, wave: 'triangle', volume: 0.45 }),
    ),
  // Victory: two-phrase fanfare with a harmony line a third below.
  'victory.wav': () =>
    mix(
      voice([['G4', 0.5], ['C5', 0.5], ['E5', 0.5], ['G5', 1], ['E5', 0.5], ['G5', 0.5], ['A5', 0.5], ['G5', 0.5], ['C6', 2]], { bpm: 260, duty: 0.25, volume: 0.28 }),
      voice([['E4', 0.5], ['G4', 0.5], ['C5', 0.5], ['E5', 1], ['C5', 0.5], ['E5', 0.5], ['F5', 0.5], ['E5', 0.5], ['E5', 2]], { bpm: 260, duty: 0.5, volume: 0.16 }),
      voice([['C3', 1.5], ['C3', 1.5], ['F2', 1], ['G2', 1], ['C3', 2]], { bpm: 260, wave: 'triangle', volume: 0.45 }),
    ),

  // --- Background loop: 2 bars of 4/4 at 120 bpm in A minor (exactly 4 s, loops cleanly) ---
  'music-loop.wav': () => {
    const bass = voice(
      [['A2', 0.5], ['E3', 0.5], ['A2', 0.5], ['E3', 0.5], ['A2', 0.5], ['E3', 0.5], ['G2', 0.5], ['B2', 0.5],
       ['F2', 0.5], ['C3', 0.5], ['F2', 0.5], ['C3', 0.5], ['G2', 0.5], ['D3', 0.5], ['E2', 0.5], ['G#2', 0.5]],
      { bpm: 120, wave: 'triangle', volume: 0.5, release: 0.6 },
    );
    const lead = voice(
      [[null, 1], ['E5', 0.5], ['C5', 0.5], ['D5', 1], [null, 1],
       [null, 1], ['F5', 0.5], ['E5', 0.5], ['D5', 0.5], ['B4', 0.5], [null, 1]],
      { bpm: 120, duty: 0.25, volume: 0.14, release: 0.5 },
    );
    const hat = concat(...Array.from({ length: 8 }, () => concat(sweep(8000, 6000, 0.02, { wave: 'noise', volume: 0.12 }), new Array(Math.round(0.48 * RATE)).fill(0))));
    return mix(bass, lead, hat).slice(0, 4 * RATE);
  },

  // Generated last: the noise generator is shared state, so adding sounds at the end
  // keeps every earlier file byte-identical.
  // Intro: a pompous mock-march in D major for the executive-order cutscene
  // (original composition: rising fourths, a swagger turn, a tonic stamp).
  'intro.wav': () =>
    mix(
      voice(
        [['A4', 0.5], ['D5', 0.5], ['D5', 0.5], ['F#5', 0.5], ['E5', 1], ['A4', 1],
         ['B4', 0.5], ['E5', 0.5], ['E5', 0.5], ['G5', 0.5], ['F#5', 0.5], ['E5', 0.5], ['D5', 2]],
        { bpm: 200, duty: 0.25, volume: 0.28, release: 0.8 },
      ),
      voice(
        [['D3', 1], ['A2', 1], ['D3', 1], ['A2', 1], ['G2', 1], ['E2', 1], ['A2', 1], ['D3', 2]],
        { bpm: 200, wave: 'triangle', volume: 0.45 },
      ),
      concat(...Array.from({ length: 5 }, () => concat(sweep(160, 60, 0.08, { volume: 0.35, noiseMix: 0.4 }), new Array(Math.round(0.52 * RATE)).fill(0)))),
    ),
};

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [name, build] of Object.entries(sounds)) fs.writeFileSync(path.join(OUT, name), wav(build()));
  console.log(`Wrote ${Object.keys(sounds).length} sounds to ${OUT}`);
}
