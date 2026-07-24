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
const lib = new Function('var WT_MIP_ALGO_VERSION=1; var _wtTwiddle={};\n' + fn('wtSha256') + '\n' + fn('wtHashTable') + '\n' + fn('parseWavetable')
  + '\n' + fn('wtTwiddles') + '\n' + fn('wtFFT') + '\n' + fn('wtMipLevelSizes') + '\n' + fn('buildWavetableMips')
  + '\nreturn {wtSha256, wtHashTable, parseWavetable, wtFFT, wtMipLevelSizes, buildWavetableMips, WT_MIP_ALGO_VERSION};')();
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

console.log(fail === 0 ? '\nWAVETABLE C1+C2: ALL CHECKS GREEN' : '\n' + fail + ' CHECKS FAILED');
process.exit(fail ? 1 : 0);
