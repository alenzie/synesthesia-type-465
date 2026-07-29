// Wavetable C1 checks: parseWavetable + canonical hash over the generated fixture matrix.
// Usage: node wavetable-check.js [html-file]   (run make-wavetable-fixtures.js first — this does it for you)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
execFileSync(process.execPath, [path.join(__dirname, 'make-wavetable-fixtures.js')], { stdio: 'ignore' });

const file = process.argv[2] || path.resolve(__dirname, '..', 'OsciSynth Type 465.dc.html');
const html = fs.readFileSync(file, 'utf8');
function fn(name) {
  const start = html.indexOf('function ' + name + '(');
  if (start < 0) throw new Error(name + ' not found');
  let i = html.indexOf('{', start), d = 0, end = -1;
  for (; i < html.length; i++) { if (html[i] === '{') d++; else if (html[i] === '}') { if (--d === 0) { end = i + 1; break; } } }
  return html.slice(start, end);
}
// Read the version constant from the LIVE source — a synthetic value would make the version check vacuous.
const verM = /var\s+WT_MIP_ALGO_VERSION\s*=\s*(\d+)\s*;/.exec(html);
if (!verM) throw new Error('WT_MIP_ALGO_VERSION not found in the live source');
const lib = new Function('var WT_MIP_ALGO_VERSION=' + verM[1] + '; var _wtTwiddle={};\n' + fn('wtSha256') + '\n' + fn('wtHashTable') + '\n' + fn('parseWavetable')
  + '\n' + fn('wtTwiddles') + '\n' + fn('wtFFT') + '\n' + fn('wtMipLevelSizes') + '\n' + fn('buildWavetableMips')
  + '\n' + fn('wtWorkerSource') + '\n' + fn('buildWavetableMipsAsync')
  + '\nreturn {wtSha256, wtHashTable, parseWavetable, wtFFT, wtMipLevelSizes, buildWavetableMips, wtWorkerSource, buildWavetableMipsAsync, WT_MIP_ALGO_VERSION};')();
const F = (name) => { const b = fs.readFileSync(path.join(__dirname, 'fixtures', name)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };

let fail = 0;
const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS' : 'FAIL') + '  ' + n + (d ? '  — ' + d : '')); };
const throws = (name, f, re) => { try { f(); ok(name, false, 'did not throw'); } catch (e) { ok(name, re.test(e.message), e.message); } };

// sha256 cross-check against node crypto (the canonical-hash foundation)
{
  const crypto = require('crypto');
  const cases = [new Uint8Array(0), new Uint8Array([0]), Uint8Array.from({ length: 4097 }, (_, i) => (i * 31 + 7) & 0xff)];
  ok('wtSha256 matches node crypto on 3 vectors', cases.every(b => lib.wtSha256(b) === crypto.createHash('sha256').update(b).digest('hex')));
}

// clm int16
{
  const t = lib.parseWavetable(F('clm-4x2048-int16.wav'));
  ok('clm int16: 4x2048 mono, source clm, interp raw1/play1', t.frames === 4 && t.frameSize === 2048 && t.channels === 1 && t.meta.source === 'clm' && t.meta.interp.raw === 1 && t.meta.interp.play === 1);
  ok('clm comment parsed', t.meta.comment === 'fixture', t.meta.comment);
  ok('hash is stable across parses', lib.wtHashTable(t) === lib.wtHashTable(lib.parseWavetable(F('clm-4x2048-int16.wav'))));
}
// int24 sign extension: same content as int16 within quantization
{
  const a = lib.parseWavetable(F('clm-4x2048-int16.wav')), b = lib.parseWavetable(F('clm-4x2048-int24.wav'));
  let worst = 0; for (let i = 0; i < a.dataL.length; i++) worst = Math.max(worst, Math.abs(a.dataL[i] - b.dataL[i]));
  ok('int24 decodes (sign extension) within 16-bit quantization of int16', worst < 2 / 32768, 'worst ' + worst.toExponential(2));
  ok('int24 has negative samples (sign extension actually exercised)', b.dataL.some(v => v < -0.5));
}
// float32 + spectral interp collapse
{
  const t = lib.parseWavetable(F('clm-4x2048-float32.wav'));
  ok('float32 parses; spectral raw=2 collapses to play=1', t.meta.interp.raw === 2 && t.meta.interp.play === 1);
}
// no clm -> inference
{
  const t = lib.parseWavetable(F('noclm-2x2048.wav'));
  ok('no-clm infers 2048x2', t.frameSize === 2048 && t.frames === 2 && t.meta.source === 'inferred');
}
// stereo X/Y
{
  const t = lib.parseWavetable(F('stereo-xy-4x2048.wav'));
  ok('stereo de-interleaves to L/R', t.channels === 2 && t.dataR && t.dataL.length === t.dataR.length && t.frames === 4);
  ok('stereo L!=R (real X/Y content)', t.dataL.some((v, i) => Math.abs(v - t.dataR[i]) > 0.1));
}
// EXTENSIBLE
{
  const t = lib.parseWavetable(F('extensible-int16.wav'));
  ok('WAVE_FORMAT_EXTENSIBLE resolves via SubFormat', t.frames === 1 && t.frameSize === 2048);
}
// junk/list/shuffled order + interp 0
{
  const t = lib.parseWavetable(F('junky-order.wav'));
  ok('JUNK/LIST chunks + shuffled order parse; interp raw0/play0', t.frames === 2 && t.meta.interp.raw === 0 && t.meta.interp.play === 0);
}
// DC/Nyquist content survives parse VERBATIM (mip stage owns removal — hash boundary rule)
{
  const t = lib.parseWavetable(F('dc-nyquist-2x2048.wav'));
  const mean = t.dataL.slice(0, 2048).reduce((a, v) => a + v, 0) / 2048;
  ok('DC offset survives parsing untouched (removal is mip-stage)', Math.abs(mean - 0.25) < 1e-3, 'mean ' + mean.toFixed(4));
}
// degenerate frame counts
ok('1-frame table parses', lib.parseWavetable(F('one-frame.wav')).frames === 1);
ok('2-frame stepped table parses', lib.parseWavetable(F('two-frame-stepped.wav')).meta.interp.play === 0);
// repairs
{
  const t = lib.parseWavetable(F('odd-tail.wav'));
  ok('odd tail truncated with notice', t.frames === 2 && t.meta.truncated.some(x => /partial trailing/.test(x)), t.meta.truncated.join('; '));
}
{
  const t = lib.parseWavetable(F('cap-300x256.wav'));
  ok('300 frames capped to 256 with notice', t.frames === 256 && t.frameSize === 256 && t.meta.truncated.some(x => /capped/.test(x)));
}
{
  const t = lib.parseWavetable(F('hot-float.wav'));
  let peak = 0; t.dataL.forEach(v => peak = Math.max(peak, Math.abs(v)));
  ok('hot float peak-normalized globally with notice', peak <= 1 + 1e-6 && t.meta.truncated.some(x => /peak-normalized/.test(x)), 'peak ' + peak.toFixed(4));
}
// rejects
throws('corrupt file rejects readably', () => lib.parseWavetable(F('corrupt.wav')), /fmt chunk|too short|Not a RIFF/i);
throws('surge sample-flag rejects', () => lib.parseWavetable(F('surge-sample-flag.wt')), /sample, not a wavetable/);
throws('surge zero-frame header rejects', () => lib.parseWavetable(F('surge-zero-frames.wt')), /zero frames/);
throws('non-finite float samples reject', () => lib.parseWavetable(F('nonfinite-float.wav')), /non-finite/);
throws('short fmt chunk rejects', () => lib.parseWavetable(F('short-fmt.wav')), /fmt chunk too short/);
throws('bogus EXTENSIBLE GUID rejects', () => lib.parseWavetable(F('bad-guid-extensible.wav')), /SubFormat GUID/);

// surge — REAL flag masks (wtf_is_sample=1, int16=4, int16_is_16=8, has_metadata=0x10)
{
  const full = lib.parseWavetable(F('surge-4x512-int16.wt'));
  ok('surge int16 full-range (flags 0x0c) parses', full.frames === 4 && full.frameSize === 512 && full.channels === 1 && full.meta.source === 'vawt');
  ok('surge int16 full-range decodes to ~unity peak', Math.max(...full.dataL.map(Math.abs)) > 0.9);
  const half = lib.parseWavetable(F('surge-4x512-int15.wt'));
  ok('surge 15-bit range (flags 0x04) parses and scales the same', Math.abs(Math.max(...half.dataL.map(Math.abs)) - Math.max(...full.dataL.map(Math.abs))) < 0.01);
  const flt = lib.parseWavetable(F('surge-4x512-float.wt'));
  ok('surge float32 (no int16 flag) parses', flt.frames === 4 && Math.max(...flt.dataL.map(Math.abs)) > 0.9);
  const meta = lib.parseWavetable(F('surge-metadata.wt'));
  ok('surge has_metadata tail does not disturb frame math', meta.frames === 4 && meta.frameSize === 512);
  const liar = lib.parseWavetable(F('surge-liar-header.wt'));
  ok('surge hostile header (claims 60000 frames) clamps to what the file holds', liar.frames === 4 && liar.meta.truncated.some(x => /only 4 of 60000/.test(x)), liar.meta.truncated.join('; '));
}
// malformed clm is ignored, not trusted
{
  const t = lib.parseWavetable(F('bad-clm.wav'));
  ok('malformed clm ignored; falls back to inference', t.meta.source === 'inferred' && t.frameSize === 2048 && t.meta.truncated.some(x => /malformed clm/.test(x)), t.meta.truncated.join('; '));
}
// hash distinguishes content and metadata
{
  const a = lib.parseWavetable(F('clm-4x2048-int16.wav')), b = lib.parseWavetable(F('clm-4x2048-float32.wav'));
  ok('hash differs across bit-depth/interp variants', lib.wtHashTable(a) !== lib.wtHashTable(b));
}
// INDEPENDENT canonical-hash oracle: rebuild the contract's byte image here (explicit LE DataView
// writes, node crypto) rather than comparing the implementation to itself — this catches a
// deterministic mistake in field order/inclusion, which self-comparison cannot.
{
  const crypto = require('crypto');
  const oracle = (t) => {
    const n = t.dataL.length + (t.dataR ? t.dataR.length : 0);
    const buf = Buffer.alloc(n * 4 + 16);
    let o = 0;
    for (let i = 0; i < t.dataL.length; i++) { buf.writeFloatLE(t.dataL[i], o); o += 4; }
    if (t.dataR) for (let i = 0; i < t.dataR.length; i++) { buf.writeFloatLE(t.dataR[i], o); o += 4; }
    buf.writeUInt32LE(t.frameSize, o); buf.writeUInt32LE(t.frames, o + 4);
    buf.writeUInt32LE(t.channels, o + 8); buf.writeUInt32LE(t.meta.interp.raw, o + 12);
    return crypto.createHash('sha256').update(buf).digest('hex');
  };
  for (const f of ['clm-4x2048-int16.wav', 'stereo-xy-4x2048.wav', 'surge-4x512-int16.wt']) {
    const t = lib.parseWavetable(F(f));
    ok('hash matches independent oracle: ' + f, lib.wtHashTable(t) === oracle(t), lib.wtHashTable(t).slice(0, 16));
  }
  // and the oracle is sensitive to field order/inclusion (guard against a vacuous oracle)
  const t = lib.parseWavetable(F('clm-4x2048-int16.wav'));
  const mutated = Object.assign({}, t, { frames: t.frames + 1 });
  ok('oracle is sensitive to metadata changes', oracle(mutated) !== oracle(t));
}
// opportunistic private real-table check (copyright: never committed)
const priv = path.join(__dirname, 'fixtures', 'private');
if (fs.existsSync(priv)) {
  for (const f of fs.readdirSync(priv).filter(x => /\.(wav|wt)$/i.test(x))) {
    try { const t = lib.parseWavetable(F(path.join('private', f))); ok('private: ' + f, t.frames >= 1, `${t.frames}x${t.frameSize} ch${t.channels} src=${t.meta.source}`); }
    catch (e) { ok('private: ' + f, false, e.message); }
  }
}

// ============================== C2: mip pyramid ==============================
// Independent DFT oracle (naive, O(n^2)) — never reuses wtFFT, so an FFT bug cannot hide.
function dftMag(x) {
  const n = x.length, out = new Float64Array(n / 2 + 1);
  for (let k = 0; k <= n / 2; k++) {
    let re = 0, im = 0;
    for (let i = 0; i < n; i++) { const a = -2 * Math.PI * k * i / n; re += x[i] * Math.cos(a); im += x[i] * Math.sin(a); }
    out[k] = Math.hypot(re, im) / n;
  }
  return out;
}
// 1. FFT round-trip against the oracle
{
  const n = 64, x = Float64Array.from({ length: n }, (_, i) => Math.sin(2 * Math.PI * 3 * i / n) + 0.5 * Math.cos(2 * Math.PI * 7 * i / n) + 0.1);
  const re = Float64Array.from(x), im = new Float64Array(n);
  lib.wtFFT(re, im, false);
  const mag = dftMag(x);
  let worst = 0; for (let k = 0; k <= n / 2; k++) worst = Math.max(worst, Math.abs(Math.hypot(re[k], im[k]) / n - mag[k]));
  ok('wtFFT magnitudes match a naive DFT oracle', worst < 1e-12, 'worst ' + worst.toExponential(2));
  lib.wtFFT(re, im, true);
  let rt = 0; for (let i = 0; i < n; i++) rt = Math.max(rt, Math.abs(re[i] / n - x[i]));
  ok('wtFFT inverse round-trips (unscaled both ways, /N by caller)', rt < 1e-12, 'worst ' + rt.toExponential(2));
}
// 2. level sizes are parametric in the real frameSize
{
  ok('level sizes for N=2048 are 2048..8 (9 levels)', lib.wtMipLevelSizes(2048).join(',') === '2048,1024,512,256,128,64,32,16,8');
  ok('level sizes for N=512 are 512..8 (7 levels)', lib.wtMipLevelSizes(512).join(',') === '512,256,128,64,32,16,8');
}
// Mip levels are STORED as Float32 (~1.2e-7 relative precision), so residuals of ~1e-9 are the
// storage format, not the algorithm: measured in float64 the same computation leaves DC at 4.8e-19
// and Nyquist at 1.5e-16 (machine precision — asserted directly in check 3b below). Magnitude
// thresholds are therefore F32-aware; 1e-6 still proves a >250,000x reduction of a 0.25 DC offset.
const F32TOL = 1e-6;

// 3. band-limiting + DC/Nyquist removal at EVERY level, verified with the DFT oracle
{
  const t = lib.parseWavetable(F('clm-4x2048-int16.wav'));
  const m = lib.buildWavetableMips(t);
  ok('mips report algo version + geometry', m.mipAlgoVersion === lib.WT_MIP_ALGO_VERSION && m.frames === 4 && m.levels.length === 9);
  let badDC = 0, badNy = 0, badAbove = 0;
  for (const lv of m.levels) {
    const nk = lv.frameSize, half = nk >> 1;
    const frame3 = Float64Array.from(lv.L.subarray(2 * nk, 3 * nk)); // the bright 32-harmonic saw
    const mag = dftMag(frame3);
    if (mag[0] > F32TOL) badDC++;
    if (mag[half] > F32TOL) badNy++;
    // nothing may live at or above the level's own Nyquist
    for (let k = half; k <= half; k++) if (mag[k] > F32TOL) badAbove++;
  }
  ok('every level is DC-free', badDC === 0);
  ok('every level is Nyquist-free', badNy === 0 && badAbove === 0);
}
// 3b. the ALGORITHM itself is exact — repeat level 0 entirely in float64 (no Float32 storage) and
// require machine-precision DC/Nyquist removal. This is what licenses the F32TOL above.
{
  const t = lib.parseWavetable(F('dc-nyquist-2x2048.wav'));
  const N = t.frameSize;
  const re = Float64Array.from(t.dataL.subarray(0, N)), im = new Float64Array(N);
  lib.wtFFT(re, im, false);
  const lr = new Float64Array(N), li = new Float64Array(N);
  for (let h = 1; h <= (N >> 1) - 1; h++) { lr[h] = re[h]; li[h] = im[h]; lr[N - h] = re[N - h]; li[N - h] = im[N - h]; }
  lib.wtFFT(lr, li, true);
  for (let i = 0; i < N; i++) lr[i] /= N;
  const mag = dftMag(lr);
  ok('float64: DC removal is machine-precision (algorithm is exact)', mag[0] < 1e-15, mag[0].toExponential(2));
  ok('float64: Nyquist removal is machine-precision', mag[N / 2] < 1e-14, mag[N / 2].toExponential(2));
}

// 4. level 0 == original MINUS DC and Nyquist (not a byte copy)
{
  const t = lib.parseWavetable(F('dc-nyquist-2x2048.wav'));
  const m = lib.buildWavetableMips(t);
  const N = t.frameSize;
  const orig = Float64Array.from(t.dataL.subarray(0, N));      // frame 0 carries a +0.25 DC offset
  const lvl0 = Float64Array.from(m.levels[0].L.subarray(0, N));
  const mo = dftMag(orig), ml = dftMag(lvl0);
  ok('original fixture really has DC (test is not vacuous)', mo[0] > 0.2, 'DC ' + mo[0].toFixed(4));
  ok('level 0 removed DC', ml[0] < F32TOL, ml[0].toExponential(2));
  let worst = 0; for (let k = 1; k < N / 2; k++) worst = Math.max(worst, Math.abs(mo[k] - ml[k]));
  ok('level 0 preserves every harmonic 1..N/2-1', worst < F32TOL, 'worst ' + worst.toExponential(2));
  const nyFrame = Float64Array.from(t.dataL.subarray(N, 2 * N)), nyLvl = Float64Array.from(m.levels[0].L.subarray(N, 2 * N));
  ok('Nyquist-bearing fixture: original has Nyquist energy', dftMag(nyFrame)[N / 2] > 0.05);
  ok('level 0 removed Nyquist', dftMag(nyLvl)[N / 2] < F32TOL, dftMag(nyLvl)[N / 2].toExponential(2));
}
// 5. amplitude preservation across levels (the 1/N-not-1/Nk scaling contract)
{
  const N = 256, frames = 1;
  const tab = { frameSize: N, frames, channels: 1, dataL: Float32Array.from({ length: N }, (_, i) => 0.7 * Math.sin(2 * Math.PI * i / N)), dataR: null, meta: { interp: { raw: 1, play: 1 } } };
  const m = lib.buildWavetableMips(tab);
  let worst = 0;
  for (const lv of m.levels) { const mag = dftMag(Float64Array.from(lv.L.subarray(0, lv.frameSize))); worst = Math.max(worst, Math.abs(mag[1] * 2 - 0.7)); }
  ok('a retained harmonic keeps its amplitude at EVERY level', worst < F32TOL, 'worst dev ' + worst.toExponential(2));
}
// 6. stereo builds both channels; determinism
{
  const t = lib.parseWavetable(F('stereo-xy-4x2048.wav'));
  const a = lib.buildWavetableMips(t), b = lib.buildWavetableMips(t);
  ok('stereo mips build both channels', a.levels.every(l => l.R && l.R.length === l.L.length));
  let same = true;
  for (let i = 0; i < a.levels.length && same; i++) {
    same = a.levels[i].L.every((v, j) => v === b.levels[i].L[j]) && a.levels[i].R.every((v, j) => v === b.levels[i].R[j]);
  }
  ok('mip build is deterministic (byte-identical across runs)', same);
}
// 7. non-2048 frame sizes work (the parametric requirement)
{
  const t = lib.parseWavetable(F('surge-4x512-int16.wt'));
  const m = lib.buildWavetableMips(t);
  ok('512-sample frames build a correct pyramid', m.levels.length === 7 && m.levels[0].frameSize === 512 && m.levels[6].frameSize === 8);
  ok('512-frame level 0 is DC-free', dftMag(Float64Array.from(m.levels[0].L.subarray(0, 512)))[0] < F32TOL);
}

// 8. the 8-sample floor is enforced at both ends
throws('wtMipLevelSizes refuses sub-8 frame sizes', () => lib.wtMipLevelSizes(4), /below the 8-sample/);
ok('live source declares a mip algo version', Number.isInteger(lib.WT_MIP_ALGO_VERSION) && lib.WT_MIP_ALGO_VERSION >= 1, String(lib.WT_MIP_ALGO_VERSION));

// 9. the WORKER SOURCE actually works — it is assembled by string concatenation of .toString(),
// exactly the construct that breaks silently. Evaluate it in a fake worker scope and require the
// result to equal the direct build byte-for-byte.
{
  const t = lib.parseWavetable(F('clm-4x2048-int16.wav'));
  const src = lib.wtWorkerSource();
  const scope = { self: null, postMessage: null };
  scope.self = { onmessage: null, postMessage: (msg) => { scope.result = msg; } };
  new Function('self', src)(scope.self);
  ok('worker source registers an onmessage handler', typeof scope.self.onmessage === 'function');
  scope.self.onmessage({ data: { frameSize: t.frameSize, frames: t.frames, channels: t.channels, dataL: t.dataL, dataR: t.dataR } });
  ok('worker source returns ok:true with mips', !!(scope.result && scope.result.ok && scope.result.mips));
  const direct = lib.buildWavetableMips(t), viaWorker = scope.result.mips;
  ok('worker mips report the live algo version', viaWorker.mipAlgoVersion === lib.WT_MIP_ALGO_VERSION);
  let same = viaWorker.levels.length === direct.levels.length;
  for (let i = 0; i < direct.levels.length && same; i++) same = direct.levels[i].L.every((v, j) => v === viaWorker.levels[i].L[j]);
  ok('worker-built mips are byte-identical to the direct build', same);
  // and a throwing payload must report ok:false rather than escaping
  scope.result = null;
  scope.self.onmessage({ data: { frameSize: 4, frames: 1, channels: 1, dataL: new Float32Array(4), dataR: null } });
  ok('worker reports errors as ok:false (does not throw out of the handler)', !!(scope.result && scope.result.ok === false && /8-sample/.test(scope.result.error)), scope.result && scope.result.error);
}

// ============================== C3: the oscillator ==============================
// Load SynthCore + Component headlessly to exercise the real audio path.
{
  const sm = /<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(html);
  class DCLogic { constructor(){ this.state={}; this._refs={}; } setState(o){ Object.assign(this.state,o); } }
  global.window = { SYNESTHESIA_BANKS: {} };
  global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const Component = new Function('DCLogic', sm[1] + '\nreturn Component;')(DCLogic);
  const mk = (gen) => { const c = new Component({}); c.ctx = { sampleRate: 48000 }; c.running = true; c.state.gen = gen; c.state.drone = true; return c; };
  const render = (c, blocks = 4, n = 2048) => {
    const L = new Float32Array(blocks * n), R = new Float32Array(blocks * n);
    for (let b = 0; b < blocks; b++) { const l = new Float32Array(n), r = new Float32Array(n);
      c.process({ outputBuffer: { getChannelData: (ch) => ch === 0 ? l : r } }); L.set(l, b * n); R.set(r, b * n); }
    return { L, R };
  };
  const rms = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);

  // built-in exists in every core, by construction, with no transport
  {
    const c = mk('wavetable');
    const bi = c.core.wtCache[c.core.WT_BUILTIN];
    ok('built-in table exists at core construction', !!bi && bi.frames === 16 && bi.frameSize === 2048);
    ok('built-in has a full mip pyramid', bi.levels.length === 9 && bi.levels[8].frameSize === 8);
    // additive construction must satisfy the C2 contract: DC-free and Nyquist-free at every level
    let badDC = 0, badNy = 0;
    for (const lv of bi.levels) { const f = Float64Array.from(lv.L.subarray(8 * lv.frameSize, 9 * lv.frameSize));
      const mag = dftMag(f); if (mag[0] > F32TOL) badDC++; if (mag[lv.frameSize >> 1] > F32TOL) badNy++; }
    ok('built-in is DC-free at every level (contract by construction)', badDC === 0);
    ok('built-in is Nyquist-free at every level', badNy === 0);
    // AMPLITUDE CONTRACT: a retained harmonic must have the same amplitude at every level. A
    // per-level normalization gain silently breaks this and makes LOD blending change timbre.
    for (const fi of [0, 8, 15]) {
      const amps = bi.levels.map(lv => dftMag(Float64Array.from(lv.L.subarray(fi * lv.frameSize, (fi + 1) * lv.frameSize)))[1]);
      const spread = Math.max(...amps) - Math.min(...amps);
      ok(`built-in frame ${fi}: fundamental amplitude is level-invariant`, spread < 1e-3, 'spread ' + spread.toExponential(2) + ' (' + amps[0].toFixed(4) + '..' + amps[amps.length - 1].toFixed(4) + ')');
    }
  }
  // cache eviction must never drop the SELECTED table
  {
    const c = mk('wavetable');
    const bi = c.core.wtCache[c.core.WT_BUILTIN];
    c.core.wtPut('t:A', bi); c.core.wtHash = 't:A';
    c.core.wtPut('t:B', bi); c.core.wtPut('t:C', bi);
    ok('LRU never evicts the currently selected table', !!c.core.wtCache['t:A'] && c.core.wtActive() === c.core.wtCache['t:A']);
    ok('LRU never evicts the built-in', !!c.core.wtCache[c.core.WT_BUILTIN]);
    ok('LRU still bounds the cache', Object.keys(c.core.wtCache).length <= 4, Object.keys(c.core.wtCache).join(','));
  }
  // it makes sound, and MORPH changes the timbre
  {
    const c = mk('wavetable'); c.P.morph = 0; const a = render(c);
    const c2 = mk('wavetable'); c2.P.morph = 1; const b = render(c2);
    ok('wavetable generator renders non-silence', rms(a.L) > 0.01, 'rms ' + rms(a.L).toFixed(4));
    ok('MORPH changes the output (frame scan works)', Math.abs(rms(a.L) - rms(b.L)) > 1e-4 || a.L.some((v, i) => Math.abs(v - b.L[i]) > 0.01));
  }
  // a MISSING hash renders the built-in, never silence (the availability rule)
  {
    const c = mk('wavetable'); c.core.wtHash = 'sha256:does-not-exist';
    ok('missing table hash falls back to the built-in (not silence)', rms(render(c).L) > 0.01);
    ok('wtActive() resolves an absent hash to the built-in', c.core.wtActive() === c.core.wtCache[c.core.WT_BUILTIN]);
  }
  // X/Y HARM must be INERT for this generator (proves v.wtPh is used, not v.px)
  {
    const a = mk('wavetable'); a.P.xHarm = 3; a.P.yHarm = 4;
    const b = mk('wavetable'); b.P.xHarm = 11; b.P.yHarm = 0.5;
    const ra = render(a), rb = render(b);
    let same = true; for (let i = 0; i < ra.L.length && same; i++) same = ra.L[i] === rb.L[i];
    ok('X/Y HARM are inert on the wavetable generator (dedicated wtPh, not px)', same);
  }
  // ST PHASE builds the X/Y figure from a mono table
  {
    // The 3-D rotation stage is ON by default (rotX/rotY/rotZ = -0.55/0.8/0.5) and deliberately mixes
    // X into Y for EVERY generator — that is the instrument's character, not a wavetable concern. Zero
    // the rotations (and jitter) to observe the table's own X/Y relationship.
    const flat = (c) => { c.P.rotX = c.P.rotY = c.P.rotZ = 0; c.P.jitter = 0; return c; };
    const a = flat(mk('wavetable')); a.P.phOff = 0; const ra = render(a);
    let identical = true; for (let i = 0; i < ra.L.length && identical; i++) identical = Math.abs(ra.L[i] - ra.R[i]) < 1e-9;
    ok('phOff=0 makes a mono table draw a diagonal (L==R, rotation+jitter off)', identical);
    const b = flat(mk('wavetable')); b.P.phOff = 0.25; const rb = render(b);
    ok('ST PHASE separates X from Y', rb.L.some((v, i) => Math.abs(v - rb.R[i]) > 0.05));
  }
  // stepped (interp=0) tables: drive the PRODUCTION branch through render(), never a re-implemented
  // formula. With 16 frames, floor(m*16) puts BOTH m=0.97 and m=1.0 on the last frame, while the
  // wrong-but-plausible floor(m*15) would split them (14 vs 15) — so identical output at those two
  // morph values is a real discriminator for the shipped mapping.
  {
    const steppedCore = (m2) => {
      const c = mk('wavetable'); c.P.rotX = c.P.rotY = c.P.rotZ = 0; c.P.jitter = 0; c.P.morph = m2;
      const bi = c.core.wtCache[c.core.WT_BUILTIN];
      c.core.wtPut('t:stepped', Object.assign({}, bi, { interp: { raw: 0, play: 0 } }));
      c.core.wtHash = 't:stepped';
      return render(c, 2);
    };
    const at97 = steppedCore(0.97), at100 = steppedCore(1.0), at50 = steppedCore(0.5);
    let sameTop = true; for (let i = 0; i < at97.L.length && sameTop; i++) sameTop = at97.L[i] === at100.L[i];
    ok('stepped: m=0.97 and m=1.0 select the SAME (last) frame — floor(m*frames)', sameTop);
    ok('stepped: a different morph selects a different frame', at50.L.some((v, i) => Math.abs(v - at100.L[i]) > 0.01));
    // and the last frame is genuinely reachable below m=1 (the bug the mapping exists to prevent)
    ok('stepped: the last frame is reachable before m=1', rms(at97.L) > 0.01 && sameTop);
  }
  // ANTI-ALIASING: the payoff test. A high note with mips vs the same render pinned to level 0.
  {
    const hi = mk('wavetable'); hi.state.drone = false; hi.P.morph = 1; hi.P.master = 0.9;
    hi.core.noteOn(100, 1.0); const withMips = render(hi, 6);
    // pin to level 0 by forcing lod=0: rebuild a core whose level list has only the full-rate level
    const flat = mk('wavetable'); flat.state.drone = false; flat.P.morph = 1; flat.P.master = 0.9;
    const bi = flat.core.wtCache[flat.core.WT_BUILTIN];
    flat.core.wtPut('t:nomips', Object.assign({}, bi, { levels: [bi.levels[0]] }));
    flat.core.wtHash = 't:nomips'; flat.core.noteOn(100, 1.0); const noMips = render(flat, 6);
    // measure energy in the top octave, where foldback lands
    const band = (x) => { const n = 4096, seg = Float64Array.from(x.subarray(x.length - n)); const mag = dftMag(seg);
      let e = 0; for (let k = Math.floor(mag.length * 0.55); k < mag.length; k++) e += mag[k] * mag[k]; return Math.sqrt(e); };
    const eMip = band(withMips.L), eFlat = band(noMips.L);
    ok('mipmapping cuts high-band foldback energy substantially', eMip < eFlat * 0.5, `mips ${eMip.toExponential(2)} vs flat ${eFlat.toExponential(2)}`);
    ok('mipped render is still audible (did not just mute everything)', rms(withMips.L) > 0.01, rms(withMips.L).toFixed(4));
  }
  // epoch guard: a stale async resolution must not steal the selection
  {
    const c = mk('wavetable');
    const bi = c.core.wtCache[c.core.WT_BUILTIN];
    c.core.wtPut('t:old', bi); c.core.wtPut('t:new', bi);
    const stale = c.wtBeginEpoch();          // an async load for 't:old' starts here
    c.wtSelect('t:new');                     // ...a newer direct selection lands first (bumps the epoch)
    const accepted = c.wtSelect('t:old', stale);
    ok('stale epoch selection is rejected', accepted === false && c.core.wtHash === 't:new', c.core.wtHash);
    const fresh = c.wtBeginEpoch();
    ok('current epoch selection is accepted', c.wtSelect('t:old', fresh) === true && c.core.wtHash === 't:old');
  }
  // other generators are untouched by all of this
  {
    const c = mk('lissajous'); ok('lissajous still renders (no regression from the new branch)', rms(render(c).L) > 0.001);
  }
}

// 10. async builder falls back to a main-thread build when no Worker exists (the file:// safety net)
(async () => {
  const t = lib.parseWavetable(F('surge-4x512-int16.wt'));
  const m = await lib.buildWavetableMipsAsync(t);   // node has no Worker global -> fallback path
  const direct = lib.buildWavetableMips(t);
  ok('buildWavetableMipsAsync falls back without a Worker', !!m && m.levels.length === direct.levels.length);
  ok('fallback build matches the direct build byte-for-byte', !!m && m.levels.every((lv, i) => lv.L.every((v, j) => v === direct.levels[i].L[j])));

  console.log(fail === 0 ? '\nWAVETABLE C1+C2+C3: ALL CHECKS GREEN' : '\n' + fail + ' CHECKS FAILED');
  process.exit(fail ? 1 : 0);
})();
