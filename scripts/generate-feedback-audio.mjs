// Synthesizes the original feedback sound effects as small 8-bit mono WAV files.
// Pure math (square/noise oscillators); no samples or sample packs are used.
// Run: node scripts/generate-feedback-audio.mjs
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(import.meta.dirname, '../src/assets/audio');
const RATE = 22050;

function wav(samples) {
  const data = Buffer.alloc(samples.length);
  samples.forEach((s, i) => {
    data[i] = Math.max(0, Math.min(255, Math.round(128 + s * 100)));
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

// notes: [frequencyHz | 'noise', durationSeconds]
function render(notes, { volume = 0.6 } = {}) {
  const out = [];
  let seed = 7;
  const noise = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed / 0x7fffffff) * 2 - 1;
  };
  for (const [frequency, duration] of notes) {
    const count = Math.round(duration * RATE);
    for (let i = 0; i < count; i++) {
      const t = i / RATE;
      const envelope = Math.min(1, i / 60) * (1 - i / count);
      const value = frequency === 'noise' ? noise() : Math.sign(Math.sin(2 * Math.PI * frequency * t));
      out.push(value * envelope * volume);
    }
  }
  return out;
}

const sounds = {
  // Descending crunch when a barrel hits.
  'hit.wav': render([['noise', 0.08], [330, 0.07], [220, 0.08], [147, 0.14]]),
  // Short rising "go again" chirp.
  'retry.wav': render([[392, 0.07], [523, 0.07], [659, 0.1]], { volume: 0.45 }),
  // Bright arpeggio for rescuing Motzfeldt.
  'rescue.wav': render([[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.2]], { volume: 0.45 }),
};
for (const [name, samples] of Object.entries(sounds)) fs.writeFileSync(path.join(OUT, name), wav(samples));
console.log(`Wrote ${Object.keys(sounds).length} sounds to ${OUT}`);
