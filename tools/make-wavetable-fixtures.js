// Deterministic wavetable fixture generator (C1). No RNG — reproducible bytes.
// Writes tools/fixtures/*.wav|.wt (gitignored; this generator is the committed artifact).
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, 'fixtures');
fs.mkdirSync(DIR, { recursive: true });

const TAU = Math.PI * 2;
const saw = (p, h) => { let s = 0; for (let k = 1; k <= h; k++) s += Math.sin(TAU * k * p) / k; return s * (2 / Math.PI); };
const frame = (n, fn) => Float32Array.from({ length: n }, (_, i) => fn(i / n));

// --- writers -------------------------------------------------------------------------------
function chunk(id, body) {
  const head = Buffer.alloc(8); head.write(id, 0, 'ascii'); head.writeUInt32LE(body.length, 4);
  const pad = body.length & 1 ? Buffer.alloc(1) : Buffer.alloc(0);
  return Buffer.concat([head, body, pad]);
}
function fmtChunk({ format = 1, channels = 1, rate = 44100, bits = 16, extensible = false }) {
  if (!extensible) {
    const b = Buffer.alloc(16);
    b.writeUInt16LE(format, 0); b.writeUInt16LE(channels, 2); b.writeUInt32LE(rate, 4);
    b.writeUInt32LE(rate * channels * (bits >> 3), 8); b.writeUInt16LE(channels * (bits >> 3), 12); b.writeUInt16LE(bits, 14);
    return chunk('fmt ', b);
  }
  const b = Buffer.alloc(40);
  b.writeUInt16LE(0xFFFE, 0); b.writeUInt16LE(channels, 2); b.writeUInt32LE(rate, 4);
  b.writeUInt32LE(rate * channels * (bits >> 3), 8); b.writeUInt16LE(channels * (bits >> 3), 12); b.writeUInt16LE(bits, 14);
  b.writeUInt16LE(22, 16); b.writeUInt16LE(bits, 18); b.writeUInt32LE(0, 20);
  b.writeUInt16LE(format, 24); // SubFormat GUID first two bytes = real format
  Buffer.from([0x00, 0x00, 0x10, 0x00, 0x80, 0x00, 0x00, 0xAA, 0x00, 0x38, 0x9B, 0x71]).copy(b, 26);
  return chunk('fmt ', b);
}
function dataChunk(samples, bits, format) {
  let b;
  if (format === 3) { b = Buffer.alloc(samples.length * 4); samples.forEach((v, i) => b.writeFloatLE(v, i * 4)); }
  else if (bits === 16) { b = Buffer.alloc(samples.length * 2); samples.forEach((v, i) => b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), i * 2)); }
  else if (bits === 24) { b = Buffer.alloc(samples.length * 3); samples.forEach((v, i) => { let x = Math.max(-8388608, Math.min(8388607, Math.round(v * 8388607))); if (x < 0) x += 0x1000000; b.writeUIntLE(x, i * 3, 3); }); }
  else { b = Buffer.alloc(samples.length * 4); samples.forEach((v, i) => b.writeInt32LE(Math.max(-2147483648, Math.min(2147483647, Math.round(v * 2147483647))), i * 4)); }
  return chunk('data', b);
}
function clmChunk(frameSize, interp, comment) {
  let s = `<!>${frameSize} ${interp}0000000 ${comment}`;
  if (s.length & 1) s += ' '; // even BlocSize (the Vital gotcha)
  return chunk('clm ', Buffer.from(s, 'ascii'));
}
function wav(file, chunks) {
  const body = Buffer.concat(chunks);
  const head = Buffer.alloc(12); head.write('RIFF', 0, 'ascii'); head.writeUInt32LE(4 + body.length, 4); head.write('WAVE', 8, 'ascii');
  fs.writeFileSync(path.join(DIR, file), Buffer.concat([head, body]));
}
const interleave = (L, R) => { const out = new Float32Array(L.length * 2); for (let i = 0; i < L.length; i++) { out[i * 2] = L[i]; out[i * 2 + 1] = R[i]; } return out; };
const concatF = (arrs) => { const n = arrs.reduce((a, x) => a + x.length, 0); const out = new Float32Array(n); let o = 0; for (const a of arrs) { out.set(a, o); o += a.length; } return out; };

// --- tables --------------------------------------------------------------------------------
const N = 2048;
// 4-frame morph: sine -> 8-harm saw -> 32-harm saw -> square-ish
const morph4 = concatF([frame(N, p => Math.sin(TAU * p)), frame(N, p => saw(p, 8)), frame(N, p => saw(p, 32)), frame(N, p => Math.tanh(4 * Math.sin(TAU * p)))]);
// stereo X/Y: circle -> 5-point star
const star = (p, k) => { const th = TAU * p; const r = 1 - k * 0.6 * Math.pow(Math.abs(Math.sin(2.5 * th)), 0.5); return r; };
const stX = [], stY = [];
for (let f = 0; f < 4; f++) { const k = f / 3; stX.push(frame(N, p => star(p, k) * Math.cos(TAU * p))); stY.push(frame(N, p => star(p, k) * Math.sin(TAU * p))); }
const stereoL = concatF(stX), stereoR = concatF(stY);

// --- fixture set ---------------------------------------------------------------------------
wav('clm-4x2048-int16.wav', [fmtChunk({}), clmChunk(N, 1, 'fixture'), dataChunk(morph4, 16, 1)]);
wav('clm-4x2048-int24.wav', [fmtChunk({ bits: 24 }), clmChunk(N, 1, 'fixture24'), dataChunk(morph4, 24, 1)]);
wav('clm-4x2048-float32.wav', [fmtChunk({ format: 3, bits: 32 }), clmChunk(N, 2, 'spectral-flag'), dataChunk(morph4, 32, 3)]);
wav('noclm-2x2048.wav', [fmtChunk({}), dataChunk(morph4.subarray(0, N * 2), 16, 1)]);
wav('stereo-xy-4x2048.wav', [fmtChunk({ format: 3, bits: 32, channels: 2 }), clmChunk(N, 1, 'xy'), dataChunk(interleave(stereoL, stereoR), 32, 3)]);
wav('extensible-int16.wav', [fmtChunk({ extensible: true }), clmChunk(N, 1, 'ext'), dataChunk(morph4.subarray(0, N), 16, 1)]);
// junk/list chunks, shuffled order, odd-size chunk before data
wav('junky-order.wav', [chunk('JUNK', Buffer.alloc(13)), clmChunk(N, 0, 'stepped'), chunk('LIST', Buffer.from('INFOIART' + 'x', 'ascii')), fmtChunk({}), dataChunk(morph4.subarray(0, N * 2), 16, 1)]);
// DC offset frame + a Nyquist-component frame (survive parse verbatim; mip stage removes)
const dcNy = concatF([frame(N, p => 0.25 + 0.5 * Math.sin(TAU * p)), frame(N, (p, i) => 0.5 * Math.sin(TAU * p) + 0.2 * ((Math.round(p * N) % 2) ? -1 : 1))]);
wav('dc-nyquist-2x2048.wav', [fmtChunk({ format: 3, bits: 32 }), clmChunk(N, 1, 'dcny'), dataChunk(dcNy, 32, 3)]);
// degenerate frame counts
wav('one-frame.wav', [fmtChunk({}), clmChunk(N, 1, 'one'), dataChunk(morph4.subarray(0, N), 16, 1)]);
wav('two-frame-stepped.wav', [fmtChunk({}), clmChunk(N, 0, 'two'), dataChunk(morph4.subarray(0, N * 2), 16, 1)]);
// odd tail: 2 frames + 100 stray samples
wav('odd-tail.wav', [fmtChunk({}), clmChunk(N, 1, 'tail'), dataChunk(concatF([morph4.subarray(0, N * 2), frame(100, p => p)]), 16, 1)]);
// 300 frames (> 256 cap): tiny frames to keep the file small — clm declares 256-size frames
const many = concatF(Array.from({ length: 300 }, (_, f) => frame(256, p => Math.sin(TAU * p * (1 + (f % 7))))));
wav('cap-300x256.wav', [fmtChunk({}), clmChunk(256, 1, 'many'), dataChunk(many, 16, 1)]);
// hot file (> 0 dBFS float) -> global peak normalize
wav('hot-float.wav', [fmtChunk({ format: 3, bits: 32 }), clmChunk(N, 1, 'hot'), dataChunk(Float32Array.from(morph4.subarray(0, N), v => v * 1.8), 32, 3)]);
// corrupt: RIFF header, then garbage
fs.writeFileSync(path.join(DIR, 'corrupt.wav'), Buffer.concat([Buffer.from('RIFFxxxxWAVE', 'ascii'), Buffer.from([1, 2, 3, 4, 5])]));

// Surge .wt: 4 x 512 int16 full-range
{
  const n = 512, fr = 4;
  const smp = concatF(Array.from({ length: fr }, (_, f) => frame(n, p => saw(p, 4 + f * 8))));
  const head = Buffer.alloc(12); head.write('vawt', 0, 'ascii'); head.writeUInt32LE(n, 4); head.writeUInt16LE(fr, 8); head.writeUInt16LE(0x80 | 0x40, 10);
  const b = Buffer.alloc(smp.length * 2); smp.forEach((v, i) => b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), i * 2));
  fs.writeFileSync(path.join(DIR, 'surge-4x512.wt'), Buffer.concat([head, b]));
  // and a "sample" flagged .wt that must be rejected
  const head2 = Buffer.from(head); head2.writeUInt16LE(0x40 | 0x10, 10);
  fs.writeFileSync(path.join(DIR, 'surge-sample-flag.wt'), Buffer.concat([head2, b.subarray(0, 1024)]));
}
console.log('fixtures written to', DIR, fs.readdirSync(DIR).length, 'files');
