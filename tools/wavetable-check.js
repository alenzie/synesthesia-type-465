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
const lib = new Function(fn('wtSha256') + '\n' + fn('wtHashTable') + '\n' + fn('parseWavetable') + '\nreturn {wtSha256, wtHashTable, parseWavetable};')();
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
// surge
{
  const t = lib.parseWavetable(F('surge-4x512.wt'));
  ok('surge .wt: 4x512 int16 full-range', t.frames === 4 && t.frameSize === 512 && t.channels === 1 && t.meta.source === 'vawt');
}
// hash distinguishes content and metadata
{
  const a = lib.parseWavetable(F('clm-4x2048-int16.wav')), b = lib.parseWavetable(F('clm-4x2048-float32.wav'));
  ok('hash differs across bit-depth/interp variants', lib.wtHashTable(a) !== lib.wtHashTable(b));
}
// opportunistic private real-table check (copyright: never committed)
const priv = path.join(__dirname, 'fixtures', 'private');
if (fs.existsSync(priv)) {
  for (const f of fs.readdirSync(priv).filter(x => /\.(wav|wt)$/i.test(x))) {
    try { const t = lib.parseWavetable(F(path.join('private', f))); ok('private: ' + f, t.frames >= 1, `${t.frames}x${t.frameSize} ch${t.channels} src=${t.meta.source}`); }
    catch (e) { ok('private: ' + f, false, e.message); }
  }
}

console.log(fail === 0 ? '\nWAVETABLE C1: ALL CHECKS GREEN' : '\n' + fail + ' CHECKS FAILED');
process.exit(fail ? 1 : 0);
