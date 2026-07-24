import fs from 'fs';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
const require = createRequire(import.meta.url);
// The package's CJS entry exports nothing usable — import its ESM dist, resolved through normal
// node_modules lookup from this script's location upward (tools/ or repo-root installs both work).
const { instantiateFaustModuleFromFile, LibFaust, FaustCompiler, FaustMonoDspGenerator } =
  await import(pathToFileURL(require.resolve('@grame/faustwasm/dist/esm/index.js')).href);

import path from 'path';
import { fileURLToPath } from 'url';
// fileURLToPath, not URL.pathname — the latter stays percent-encoded and this repo path has spaces.
const __dir = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(__dir, '..', 'OsciSynth Type 465.dc.html');
const html = fs.readFileSync(htmlPath, 'utf8');
function method(name, sig) {
  const start = html.indexOf(name + sig);
  if (start < 0) throw new Error(name + ' not found');
  let i = html.indexOf('{', start + name.length + sig.length - 1), d = 0, end = -1;
  for (; i < html.length; i++) { if (html[i] === '{') d++; else if (html[i] === '}') { if (--d === 0) { end = i + 1; break; } } }
  return new Function('return function ' + html.slice(start, end).replace(name + '(', 'fn(')) ();
}
const ctx = {};
ctx._eqCoeffs = method('_eqCoeffs', '(type,f,gainDb,q,sr){');
ctx._eqDepthNotch = method('_eqDepthNotch', '(bd){');
ctx._eqSections = method('_eqSections', '(bd,f,g,q,sr){');
ctx._faustDsp = method('_faustDsp', '(){');

const modPath = require.resolve('@grame/faustwasm/libfaust-wasm/libfaust-wasm.js');
const libFaust = new LibFaust(await instantiateFaustModuleFromFile(modPath));
const compiler = new FaustCompiler(libFaust);

const SR = 48000, N = 48000;
const rms = (a, from, to) => { let s = 0, c = 0; for (let k = from; k < to; k++) { s += a[k] * a[k]; c++; } return Math.sqrt(s / c); };

async function faustGainAt(dsp, freq) {
  const gen = new FaustMonoDspGenerator();
  const ok = await gen.compile(compiler, 'eq', dsp, '-I libraries -double');
  if (!ok) throw new Error('compile failed');
  const proc = await gen.createOfflineProcessor(SR, 128);
  const inp = new Float32Array(N);
  for (let k = 0; k < N; k++) inp[k] = 0.25 * Math.sin(2 * Math.PI * freq * k / SR);
  const out = proc.render([inp, inp], N);
  return 20 * Math.log10(rms(out[0], N / 2, N) / rms(inp, N / 2, N));
}
function jsGainAt(band, freq) {
  const secs = ctx._eqSections.call(ctx, band, Math.max(10, Math.min(SR * 0.49, band.freqHz)), band.gainDb, Math.max(0.1, band.q), SR);
  const zs = secs.map(() => ({ z1: 0, z2: 0 }));
  const inp = new Float64Array(N), out = new Float64Array(N);
  for (let k = 0; k < N; k++) inp[k] = 0.25 * Math.sin(2 * Math.PI * freq * k / SR);
  for (let k = 0; k < N; k++) {
    let x = inp[k];
    for (let si = 0; si < secs.length; si++) { const c = secs[si], z = zs[si]; const o = c.b0 * x + z.z1; z.z1 = c.b1 * x + z.z2 - c.a1 * o; z.z2 = c.b2 * x - c.a2 * o; x = o; }
    out[k] = x;
  }
  return 20 * Math.log10(rms(out, N / 2, N) / rms(inp, N / 2, N));
}

const dyn0 = { on: false, mode: 'down', threshDb: -24, ratio: 2, rangeDb: 0, attackMs: 10, releaseMs: 120 };
const cases = [
  { name: 'bell +6 @1k',        band: { type: 'bell', freqHz: 1000, gainDb: 6, q: 1.4, on: true, slopeDbOct: 12, muted: false, soloed: false, dyn: dyn0 }, probes: [1000, 250] },
  { name: 'low-cut 48dB q0.9',  band: { type: 'low-cut', freqHz: 200, gainDb: 0, q: 0.9, on: true, slopeDbOct: 48, muted: false, soloed: false, dyn: dyn0 }, probes: [100, 50] },
  { name: 'tilt +6 @1k',        band: { type: 'tilt', freqHz: 1000, gainDb: 6, q: 0.7, on: true, slopeDbOct: 12, muted: false, soloed: false, dyn: dyn0 }, probes: [100, 8000] },
  { name: 'depth notch -10 q8', band: { type: 'notch', freqHz: 700, gainDb: -10, q: 8, on: true, slopeDbOct: 12, muted: false, soloed: false, dyn: dyn0 }, probes: [700, 1400] },
  { name: 'high-cut 24dB',      band: { type: 'high-cut', freqHz: 5000, gainDb: 0, q: 0.71, on: true, slopeDbOct: 24, muted: false, soloed: false, dyn: dyn0 }, probes: [10000, 2000] },
];
let fail = 0;
for (const c of cases) {
  const dsp = ctx._faustDsp.call({ P: { eqMix: 1, eqOut: 0 }, eqBands: [c.band], core: ctx, _eqDepthNotch: ctx._eqDepthNotch });
  for (const f of c.probes) {
    const fg = await faustGainAt(dsp, f), jg = jsGainAt(c.band, f);
    const ok = Math.abs(fg - jg) < 0.05;
    if (!ok) fail++;
    console.log(`${c.name} @${f}Hz  faust=${fg.toFixed(3)}dB  js=${jg.toFixed(3)}dB  d=${Math.abs(fg - jg).toFixed(4)}  ${ok ? 'OK' : 'MISMATCH'}`);
  }
}
console.log(fail === 0 ? 'ALL PARITY OK' : fail + ' MISMATCHES');
process.exit(fail === 0 ? 0 : 1);
