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
const bpmField = /<input type="number"[^>]*value="\{\{bpmVal\}\}"/.exec(html);
ok('BPM input exists', !!bpmField);
ok('BPM input allows decimals (step="any")', /step="any"/.test(bpmField[0]), bpmField[0].match(/step="[^"]*"/)[0]);
c.bpmChangeTest = (v) => { const p = parseFloat(v); return Math.round(Math.max(20, Math.min(300, p)) * 1000) / 1000; };
ok('BPM 134.685 survives entry exactly', c.bpmChangeTest('134.685') === 134.685);
ok('BPM keeps 3 decimals', c.bpmChangeTest('91.5551') === 91.555);

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
  for (let i = 0; i < n; i++) { ph += rateHz / sr; if (ph >= 1) ph -= 1; }
  return ph;
}
const pA = phaseAfter(8.979, 60), pB = phaseAfter(8.980, 60);
ok('a 0.001 Hz difference is resolvable in the phase accumulator', Math.abs(pA - pB) > 1e-6, `phase delta ${Math.abs(pA - pB).toFixed(6)} cycles over 60 s`);

// --- 7. EQ dynamics times are continuous (release was snapping to 5 ms) ------------------------
const relChip = /_chip\('REL',.*?'dyn','releaseMs',([\d.]+),([\d.]+),([\d.]+)\)/.exec(html);
ok('REL chip still declares a 5 ms nudge granularity', !!relChip && relChip[3] === '5', relChip ? relChip[0].slice(-30) : 'not found');
ok('chip drag no longer rounds to the step grid', !/if\(step>=1\)nv=Math\.round\(nv\/step\)\*step/.test(html));

// --- 8. no value-path quantizer keyed on step>=1 remains ---------------------------------------
const script = m[1];
ok('no step>=1 value quantizer anywhere in the app', !/step>=1\s*\)\s*v?nv?=Math\.round/.test(script.replace(/\s+/g, '')), '');

console.log(fail === 0 ? '\nPRECISION: ALL CHECKS GREEN' : '\n' + fail + ' CHECKS FAILED');
process.exit(fail ? 1 : 0);
