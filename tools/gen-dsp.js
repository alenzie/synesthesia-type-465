// Extract _faustDsp (+ helpers) from the live HTML and run it on a worst-case band set:
// every filter type, slopes 24/48/96, tilt, depth notch, pure notch, dynamics up+down,
// muted band, bypassed band, plus empty-chain and solo variants.
// Usage: node gen-dsp.js <html-file> <out.dsp>
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');

function method(name, sig) {
  const start = html.indexOf(name + sig);
  if (start < 0) throw new Error(name + ' not found');
  let i = html.indexOf('{', start + name.length + sig.length - 1), d = 0, end = -1;
  for (; i < html.length; i++) { if (html[i] === '{') d++; else if (html[i] === '}') { if (--d === 0) { end = i + 1; break; } } }
  return new Function('return function ' + html.slice(start, end).replace(name + '(', 'fn(')) ();
}

const ctx = { P: { eqMix: 0.85, eqOut: -1.5 } };
ctx._faustDsp = method('_faustDsp', '(){');
ctx._eqDepthNotch = method('_eqDepthNotch', '(bd){');
ctx.core = ctx;

const d = (o) => Object.assign({ on: true, mode: 'down', threshDb: -24, ratio: 2, rangeDb: 6, attackMs: 10, releaseMs: 120 }, o);
const mk = (type, f, extra) => Object.assign({ type, freqHz: f, gainDb: 0, q: 1, on: true, slopeDbOct: 12, muted: false, soloed: false, dyn: d({ on: false }) }, extra);
ctx.eqBands = [
  mk('low-cut', 35, { q: 0.9, slopeDbOct: 48, end: 'lo' }),
  mk('bell', 120, { gainDb: 3.5, q: 1.4, dyn: d({ on: true, mode: 'down' }) }),
  mk('low-shelf', 250, { gainDb: -2, q: 0.8 }),
  mk('notch', 700, { gainDb: -10, q: 8, dyn: d({ on: true }) }),          // depth notch (bell)
  mk('notch', 900, { q: 12 }),                                            // pure static notch
  mk('band-pass', 1500, { q: 2 }),
  mk('low-cut', 60, { slopeDbOct: 96 }),                                  // extra sloped cut mid-band
  mk('bell', 3200, { gainDb: -4, q: 3, on: false }),                      // bypassed: omitted
  mk('bell', 2500, { gainDb: 2, muted: true }),                           // muted: omitted
  mk('high-shelf', 8000, { gainDb: 4, q: 0.7, dyn: d({ on: true, mode: 'up', rangeDb: 9 }) }),
  mk('tilt', 5000, { gainDb: 3 }),
  mk('high-cut', 16000, { q: 0.71, slopeDbOct: 24, end: 'hi' }),
];
const src = ctx._faustDsp.call(ctx);
fs.writeFileSync(process.argv[3], src);
console.log('wrote', process.argv[3], src.length, 'bytes');

const empty = ctx._faustDsp.call({ P: { eqMix: 1, eqOut: 0 }, eqBands: [], _eqDepthNotch: ctx._eqDepthNotch, core: ctx });
fs.writeFileSync(process.argv[3].replace('.dsp', '-empty.dsp'), empty);

const soloBands = ctx.eqBands.map(b => Object.assign({}, b));
soloBands[1] = Object.assign({}, soloBands[1], { soloed: true });
const solo = ctx._faustDsp.call({ P: ctx.P, eqBands: soloBands, _eqDepthNotch: ctx._eqDepthNotch, core: ctx });
fs.writeFileSync(process.argv[3].replace('.dsp', '-solo.dsp'), solo);
const soloBandCount = (solo.match(/\/\/ band /g) || []).length;
console.log('solo variant bands:', soloBandCount, soloBandCount === 1 ? 'OK' : 'FAIL');
console.log('wrote empty + solo variants');
