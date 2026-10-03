// Golden-render capture for the OsciSynth engine.
// Usage: node golden.js <html-file> <out-prefix>
// Loads the dc script headless (stub DCLogic/window/localStorage), runs scripted scenarios,
// writes raw Float32 L+R per scenario to <out-prefix>-<scenario>.bin and prints digests.
const fs = require('fs');
const crypto = require('crypto');

const html = fs.readFileSync(process.argv[2], 'utf8');
const m = html.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
if (!m) throw new Error('dc script not found');

// --- stubs ---
global.window = { SYNESTHESIA_BANKS: {} };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.performance = { now: () => 0 };
class DCLogic {
  constructor() { this.state = {}; this._refs = {}; }
  setState(s) { Object.assign(this.state, s); }
}
const Component = new Function('DCLogic', m[1] + '\nreturn Component;')(DCLogic);

// seeded LCG replaces Math.random for BOTH sides (identical call order => identical streams)
function makeLcg(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function makeComp(sr) {
  const c = new Component({});
  c.ctx = { sampleRate: sr };
  c.running = true;
  return c;
}
function fakeBlock(n) {
  const L = new Float32Array(n), R = new Float32Array(n);
  return { outputBuffer: { getChannelData: (ch) => ch === 0 ? L : R }, L, R };
}
const dyn = (o) => Object.assign({ on: false, mode: 'down', threshDb: -24, ratio: 2, rangeDb: 0, attackMs: 10, releaseMs: 120 }, o);
const band = (type, f, extra) => Object.assign({ type, freqHz: f, gainDb: 0, q: 1, on: true, slopeDbOct: 12, muted: false, soloed: false, dyn: dyn({}) }, extra);

const scenarios = {
  s1_drone_eq_post: (sr) => {
    const c = makeComp(sr);
    c.state.drone = true; c.state.gen = 'lissajous'; c.state.bpm = 120; c.state.eqTap = 'post';
    c.P.jitter = 0.4; c.P.drive = 0.3; c.P.width = 0.5; c.P.detune = 0.2;
    c.eqBands = c._eqNormalize([
      band('low-cut', 60, { on: true, slopeDbOct: 48, q: 0.8 }),
      band('bell', 300, { gainDb: 4, q: 2, dyn: dyn({ on: true, mode: 'down', rangeDb: 8, threshDb: -30 }) }),
      band('tilt', 1200, { gainDb: 3 }),
      band('notch', 800, { gainDb: -9, q: 8, dyn: dyn({ on: true, mode: 'up', rangeDb: 6, threshDb: -40 }) }),
      band('high-cut', 12000, { on: true, slopeDbOct: 24 }),
    ]);
    if (c.core) c.core.eqBands = c.eqBands;
    return { c, blocks: 50, events: {} };
  },
  s2_midi_lorenz_pre: (sr) => {
    const c = makeComp(sr);
    c.state.drone = false; c.state.gen = 'lorenz'; c.state.bpm = 133; c.state.eqTap = 'pre'; c.state.loop = false;
    c.P.jitter = 0.2; c.P.fmSync = true; c.P.fmDivision = 8; c.P.morphSync = true; c.P.morphDivision = 4;
    c.P.lfoSync = true; c.P.lfoDepth = 0.6; c.P.lfoTarget = 2; c.P.cutoff = 4000; c.P.reso = 0.4;
    c.midiBpm = 133;
    (c.core||c).midiEvents = [
      { t: 0.05, on: true, note: 48, vel: 0.9 }, { t: 0.6, on: true, note: 55, vel: 0.7 },
      { t: 0.9, on: false, note: 48 }, { t: 1.2, on: true, note: 60, vel: 0.8 },
      { t: 1.5, on: false, note: 55 }, { t: 1.7, on: false, note: 60 },
    ];
    (c.core||c).midiDur = 1.8; (c.core||c).midiPlaying = true;
    c.eqBands = c._eqNormalize([band('bell', 900, { gainDb: -5, q: 4 })]);
    if (c.core) c.core.eqBands = c.eqBands;
    return { c, blocks: 60, events: {} }; // long enough to hit end-of-song stop (~2.1s < 60*2048/sr)
  },
  s3_keys_genswap: (sr) => {
    const c = makeComp(sr);
    c.state.drone = false; c.state.gen = 'cube'; c.state.bpm = 98; c.state.eqTap = 'post';
    c.P.rotXSync = true; c.P.rotYSync = true; c.P.sustain = 0.6; c.P.width = 0.8;
    c.eqBands = c._eqNormalize([]);
    if (c.core) c.core.eqBands = c.eqBands;
    return {
      c, blocks: 40,
      events: { 5: (c) => { c.noteOn(52, 0.8, true); c.noteOn(59, 0.6, true); }, 15: (c) => { c.state.gen = 'torus'; }, 25: (c) => { c.noteOff(52); c.state.gen = 'super'; }, 35: (c) => c.noteOff(59) },
    };
  },
};

const N = 2048;
const rates = { s1_drone_eq_post: [48000, 44100], s2_midi_lorenz_pre: [48000], s3_keys_genswap: [48000] };
for (const [name, setup] of Object.entries(scenarios)) {
  for (const sr of rates[name]) {
    Math.random = makeLcg(0xC0FFEE ^ sr);
    const { c, blocks, events } = setup(sr);
    const out = new Float32Array(blocks * N * 2);
    for (let b = 0; b < blocks; b++) {
      if (events[b]) events[b](c);
      const blk = fakeBlock(N);
      c.process(blk);
      out.set(blk.L, b * N * 2); out.set(blk.R, b * N * 2 + N);
    }
    const buf = Buffer.from(out.buffer);
    const file = `${process.argv[3]}-${name}-${sr}.bin`;
    fs.writeFileSync(file, buf);
    let peak = 0; for (let i = 0; i < out.length; i++) { const a = Math.abs(out[i]); if (a > peak) peak = a; }
    console.log(name, sr, 'sha256', crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16), 'peak', peak.toFixed(5));
  }
}
