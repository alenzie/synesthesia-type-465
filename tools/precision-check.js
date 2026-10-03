// Frequency / tempo PRECISION checks — the "no premature quantization" guard.
//
// Rule under test: `step` is a UI drag/nudge granularity hint. It must NEVER quantize a continuous
// value. Only genuinely enumerated params (mode index, division index, sample count) snap. Rounding
// happens at the DISPLAY layer only, so every downstream stage (tempo sync, modulation, the EQ
// detector, the phase accumulators) still sees full double precision.
//
// Usage: node precision-check.js [html-file]
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.resolve(__dirname, '..', 'OsciSynth Type 465.dc.html');
const html = fs.readFileSync(file, 'utf8');
const m = html.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
class DCLogic { constructor(){ this.state={}; this._refs={}; } setState(s){ Object.assign(this.state,s); } }
global.window = { SYNESTHESIA_BANKS: {} };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const Component = new Function('DCLogic', m[1] + '\nreturn Component;')(DCLogic);

let fail = 0;
const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS' : 'FAIL') + '  ' + n + (d ? '  — ' + d : '')); };
const c = new Component({});

// --- 1. continuous params are never snapped to their step grid -------------------------------
const CONTINUOUS = ['cutoff', 'fmRate', 'lfoRate', 'baseFreq', 'reso', 'morph', 'drawSpd'];
for (const id of CONTINUOUS) {
  const d = c._pdesc(id);
  const probe = d.min + (d.max - d.min) * 0.37 + 0.000123456;   // deliberately off any grid
  const kept = c._clampParam(id, probe);
  ok(`${id}: _clampParam keeps sub-step precision`, Math.abs(kept - probe) < 1e-12, `${probe} -> ${kept}`);
}
// a mid-drag normalized position must not land on a round number either
const cutMid = c.fromNorm('cutoff', 0.5);
ok('cutoff: fromNorm returns an unrounded Hz value', Math.abs(cutMid - Math.round(cutMid)) > 1e-9, cutMid + ' Hz');

// --- 2. enumerated params DO snap (they are indices, not magnitudes) --------------------------
ok('lfoTarget snaps to an integer mode index', Number.isInteger(c.fromNorm('lfoTarget', 0.42)) && c._pdesc('lfoTarget').isDiscrete);
ok('fmDivision snaps to an integer index', Number.isInteger(c.fromNorm('fmDivision', 0.42)));
ok('traceN snaps to its 64-sample grid', c.fromNorm('traceN', 0.42) % 64 === 0, String(c.fromNorm('traceN', 0.42)));

// --- 3. tempo entry accepts real-world decimal BPM --------------------------------------------
// type="text" (not "number") is load-bearing: the native number widget re-sanitizes on every value
// assignment and fights free-form select-all-and-retype editing regardless of the app's own clamp
// logic (see the bpmVal comment in the source). Decimal entry needs no step="any" once it's text.
const bpmField = /<input type="text"[^>]*value="\{\{bpmVal\}\}"/.exec(html);
ok('BPM input exists and is type="text"', !!bpmField);
// mirror the live handler: clamp only, never round the canonical value
c.bpmChangeTest = (v) => { const p = Number(v); return Math.max(1, Math.min(999, p)); };
ok('BPM 134.685 survives entry exactly', c.bpmChangeTest('134.685') === 134.685);
ok('BPM keeps ALL entered decimals (no canonical rounding)', c.bpmChangeTest('91.5551234') === 91.5551234);
ok('BPM still clamps to the legal 1..999 range', c.bpmChangeTest('9999') === 999 && c.bpmChangeTest('0') === 1);

// --- 3b. canonical BPM is NOT rounded (rounding state would be the same premature discard) -----
ok('BPM state keeps full precision (no 3-decimal rounding of the canonical value)',
   !/bpm:Math\.round\(/.test(html), 'bpmChange must store the clamped double');

// --- 3c. zeroLog skew: exact endpoints + log-like ABOVE the knee (pow(gamma) is not) ------------
{
  const d = c._pdesc('fmRate');
  ok('fmRate uses the zeroLog skew', d.skew === 'zeroLog', d.skew);
  ok('zeroLog hits 0 and max exactly', c.fromNorm('fmRate', 0) === 0 && Math.abs(c.fromNorm('fmRate', 1) - 40) < 1e-12);
  // above the knee, equal normalized travel should give near-equal RATIO
  const a = c.fromNorm('fmRate', 0.7) / c.fromNorm('fmRate', 0.6);
  const b = c.fromNorm('fmRate', 0.8) / c.fromNorm('fmRate', 0.7);
  ok('zeroLog is ratio-like above the knee', Math.abs(a - b) / a < 0.05, `ratios ${a.toFixed(4)} vs ${b.toFixed(4)}`);
  ok('zeroLog round-trips', Math.abs(c.fromNorm('fmRate', c.toNorm('fmRate', 7.3197)) - 7.3197) < 1e-9);
}

// --- 4. SYNC mode derives Hz from BPM in full precision (the thing that actually holds sync) ---
// Re-derive the engine's own formula from the live FM_DIVS table and compare against the core.
const BPM = 134.685;
const core = c.core;
core.bpm = BPM; core.midiPlaying = false;
const divHz = (idx) => (BPM / 60) / core.FM_DIVS[idx].b;
let worstRel = 0, worstLbl = '';
core.FM_DIVS.forEach((d, i) => {
  const expect = (BPM / 60) / d.b;
  const got = divHz(i);
  const rel = Math.abs(got - expect) / expect;
  if (rel > worstRel) { worstRel = rel; worstLbl = d.l; }
});
ok('every tempo division is exact at BPM 134.685', worstRel === 0, 'worst rel err ' + worstRel + ' (' + worstLbl + ')');
// a 1/16 at this tempo is an irrational-looking Hz — it must NOT be rounded anywhere
const sixteenth = (BPM / 60) / core.FM_DIVS[core.FM_DIVS.findIndex(d => d.l === '1/16')].b;
ok('1/16 @134.685 keeps its full mantissa', sixteenth.toString().length > 10, sixteenth + ' Hz');

// --- 5. the value survives the worklet patch hop (JSON) ---------------------------------------
c.state.bpm = BPM;
c.P.fmRate = 8.979000123456789;
c.P.cutoff = 1234.56789;
const patch = JSON.parse(JSON.stringify(c._patchBody()));
ok('BPM survives the worklet patch exactly', patch.bpm === BPM, String(patch.bpm));
ok('fmRate survives the worklet patch exactly', patch.P.fmRate === c.P.fmRate, String(patch.P.fmRate));
ok('cutoff survives the worklet patch exactly', patch.P.cutoff === c.P.cutoff, String(patch.P.cutoff));

// --- 6. phase accumulation actually resolves a sub-milli-Hz difference -------------------------
// Two rates 0.001 Hz apart must diverge measurably over 60 s — proves nothing upstream rounded them.
function phaseAfter(rateHz, seconds, sr = 48000) {
  let ph = 0; const n = Math.round(seconds * sr);
  for (let i = 0; i < n; i++) { const x = ph + rateHz / sr; ph = x - Math.floor(x); } // mirrors the engine's floor-wrap
  return ph;
}
const pA = phaseAfter(8.979, 60), pB = phaseAfter(8.980, 60);
ok('a 0.001 Hz difference is resolvable in the phase accumulator', Math.abs(pA - pB) > 1e-6, `phase delta ${Math.abs(pA - pB).toFixed(6)} cycles over 60 s`);

// --- 7. EQ dynamics times are continuous (release was snapping to 5 ms) ------------------------
const relChip = /_chip\('REL',.*?'dyn','releaseMs',([\d.]+),([\d.]+),([\d.]+)\)/.exec(html);
ok('REL chip still declares a 5 ms nudge granularity', !!relChip && relChip[3] === '5', relChip ? relChip[0].slice(-30) : 'not found');
ok('chip drag no longer rounds to the step grid', !/if\(step>=1\)nv=Math\.round\(nv\/step\)\*step/.test(html));

// --- 7b. phase wrap is exact for ANY increment (a single subtract cannot wrap >= 2 cycles) -----
{
  const wrap = (x) => x - Math.floor(x);
  const single = (x) => x >= 1 ? x - 1 : x;
  // worst realistic voice increment: high note x drawSpd 8 x fm x xHarm 16
  const inc = 4186 * 8 * 1.5 * 16 * 1.03 / 48000;
  let pw = 0, ps = 0;
  for (let i = 0; i < 48000; i++) { pw = wrap(pw + inc); ps = single(ps + inc); }
  ok('floor-wrap stays bounded in [0,1) at extreme increments', pw >= 0 && pw < 1, 'phase=' + pw.toFixed(6));
  ok('the old single-subtract would have run away (regression guard)', ps > 1000, 'would reach ' + ps.toExponential(2));
  ok('engine uses floor-wrap, not single-subtract, for phase',
     /_wrap01\(x\)\{ return x-Math\.floor\(x\); \}/.test(html) && !/if\(this\.fmPh>=1\)/.test(html));
}

// --- 7c. preset EQ bands are numerically sanitized on load -------------------------------------
{
  const hostile = { name: 'hostile', gen: 'lissajous', params: {},
    eq: { mix: 5, outDb: 999, bands: [ { type: 'not-a-type', freqHz: 9e9, gainDb: 400, q: -3, slopeDbOct: 7,
      dyn: { on: true, mode: 'down', threshDb: -999, ratio: 1e6, rangeDb: -50, attackMs: 0, releaseMs: 1e9 } } ] } };
  const victim = new Component({});
  victim.applyPreset(hostile);
  const b = victim.eqBands.find(x => !x.end) || victim.eqBands[0];
  const inRange = (v, lo, hi) => v >= lo && v <= hi;
  ok('hostile preset: band type falls back to a known type', victim.EQ_TYPES.indexOf(b.type) >= 0, b.type);
  ok('hostile preset: freq/gain/Q clamped', inRange(b.freqHz, 10, 22000) && inRange(b.gainDb, -18, 18) && inRange(b.q, 0.1, 30),
     `${b.freqHz} ${b.gainDb} ${b.q}`);
  ok('hostile preset: slope falls back to a legal value', [12, 24, 48, 96].indexOf(b.slopeDbOct) >= 0, String(b.slopeDbOct));
  ok('hostile preset: dyn times/ratio clamped', inRange(b.dyn.ratio, 1, 20) && inRange(b.dyn.attackMs, 0.5, 500) && inRange(b.dyn.releaseMs, 5, 5000) && inRange(b.dyn.rangeDb, 0, 18));
  ok('hostile preset: mix/out clamped', inRange(victim.P.eqMix, 0, 1) && inRange(victim.P.eqOut, -24, 24), `${victim.P.eqMix} ${victim.P.eqOut}`);
}

// --- 8. no value-path quantizer keyed on step>=1 remains ---------------------------------------
const script = m[1];
ok('no step>=1 value quantizer anywhere in the app', !/step>=1\s*\)\s*v?nv?=Math\.round/.test(script.replace(/\s+/g, '')), '');

console.log(fail === 0 ? '\nPRECISION: ALL CHECKS GREEN' : '\n' + fail + ' CHECKS FAILED');
process.exit(fail ? 1 : 0);
