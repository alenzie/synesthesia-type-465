// Parameter-model + A/B + export checks (Phase 0 close-out; the descriptor table is the iPlug2 spec).
// Usage: node param-model-check.js [html-file]
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
const ok = (name, cond, detail = '') => { if (!cond) fail++; console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  — ' + detail : '')); };

const c = new Component({});

// 1. every param id has a descriptor with a usable range
const ids = c._paramIds();
const missing = ids.filter(id => !c._pdesc(id));
ok('every param id has a descriptor', missing.length === 0, missing.join(','));
const badRange = ids.filter(id => { const d = c._pdesc(id); return !(isFinite(d.min) && isFinite(d.max) && d.max > d.min); });
ok('all descriptors have a finite increasing range', badRange.length === 0, badRange.join(','));

// 2. normalized round-trip: fromNorm(toNorm(v)) == v for continuous params, and endpoints map to 0/1
let worst = 0, worstId = '';
for (const id of ids) {
  const d = c._pdesc(id);
  for (let k = 0; k <= 10; k++) {
    const v = d.min + (d.max - d.min) * (k / 10);
    const real = d.step >= 1 ? Math.round(v / d.step) * d.step : v;
    const back = c.fromNorm(id, c.toNorm(id, real));
    // fromNorm quantizes params whose step >= 1 (same rule as _clampParam) — allow half a step
    const tol = (d.step >= 1 ? d.step / 2 : 0) + 1e-9 * Math.max(1, Math.abs(real));
    const err = Math.max(0, Math.abs(back - real) - tol) / Math.max(1e-9, d.max - d.min);
    if (err > worst) { worst = err; worstId = id; }
  }
}
ok('real -> norm -> real round-trips', worst < 1e-9, 'worst rel err ' + worst.toExponential(2) + ' (' + worstId + ')');
const ends = ids.every(id => { const d = c._pdesc(id); return Math.abs(c.toNorm(id, d.min)) < 1e-12 && Math.abs(c.toNorm(id, d.max) - 1) < 1e-12; });
ok('endpoints map to exactly 0 and 1', ends);

// 3. log skew behaves: equal normalized travel = equal frequency RATIO (the automation property that matters).
// Probe baseFreq (step 0.01, unquantized) so the check tests the MAPPING, not the step grid.
const r1 = c.fromNorm('baseFreq', 0.5) / c.fromNorm('baseFreq', 0.25);
const r2 = c.fromNorm('baseFreq', 0.75) / c.fromNorm('baseFreq', 0.5);
ok('log-skewed baseFreq: equal travel = equal ratio', Math.abs(r1 - r2) / r1 < 1e-9, `ratios ${r1.toFixed(4)} vs ${r2.toFixed(4)}`);
ok('cutoff (step 1 Hz) stays ratio-like within its quantization', (() => {
  const lo = c.fromNorm('cutoff', 0.25), mid = c.fromNorm('cutoff', 0.5), hi = c.fromNorm('cutoff', 0.75);
  const a = mid / lo, b = hi / mid;
  // 1 Hz rounding at the low probe dominates: tolerate ~2 steps of relative error there.
  // A linear mapping would land ~40% off, so this still fails loudly on a wrong curve.
  const tol = 2 * c._pdesc('cutoff').step / lo;
  return Math.abs(a - b) / a < tol;
})());
// zero-inclusive frequency params use 'pow' so they can reach exactly 0
ok('fmRate reaches exactly 0 and 40 through the mapping', c.fromNorm('fmRate', 0) === 0 && Math.abs(c.fromNorm('fmRate', 1) - 40) < 1e-9);
ok('fmRate skew is bottom-heavy (fine control near 0)', c.fromNorm('fmRate', 0.5) < 40 * 0.25, 'mid=' + c.fromNorm('fmRate', 0.5).toFixed(3));
const lin1 = c.fromNorm('morph', 0.5) - c.fromNorm('morph', 0.25);
const lin2 = c.fromNorm('morph', 0.75) - c.fromNorm('morph', 0.5);
ok('linear param stays linear', Math.abs(lin1 - lin2) < 1e-12);

// 4. discrete params snap to integers and expose choices
const divIds = ids.filter(id => /Division$/.test(id));
ok('division params are discrete with choice labels', divIds.length > 0 && divIds.every(id => {
  const d = c._pdesc(id);
  return d.isDiscrete && Array.isArray(d.choices) && d.choices.length === c.FM_DIVS.length && Number.isInteger(c.fromNorm(id, 0.42));
}));
ok('formatParam renders a division label', /\//.test(c.formatParam('fmDivision', 6)), c.formatParam('fmDivision', 6));

// 5. A/B compare: swap exchanges states, is one undo step, and copy makes slots match
c.P.morph = 0.2; c.state.gen = 'torus';
const undo0 = c.undoStack.length;
c.abSwap();                        // A (morph .2) stashed; B empty -> live state unchanged
c.P.morph = 0.9;                   // edit in slot B
c.abSwap();                        // back to A
ok('A/B swap restores the other slot', Math.abs(c.P.morph - 0.2) < 1e-12, 'morph=' + c.P.morph);
c.abSwap();
ok('A/B swap returns to the edited slot', Math.abs(c.P.morph - 0.9) < 1e-12, 'morph=' + c.P.morph);
ok('A/B swaps push undo steps', c.undoStack.length > undo0);
c.abCopy();
c.abSwap();
ok('A/B copy makes both slots match', Math.abs(c.P.morph - 0.9) < 1e-12, 'morph=' + c.P.morph);

// 6. export shape: a preset that the loader can round-trip
let captured = null;
c._downloadJson = (obj, name) => { captured = { obj, name }; };
c._loadedName = 'Test Patch';
c.P.eqMix = 0.7; c.P.eqOut = -2; c.state.eqTap = 'pre';
c.exportCurrentPreset();
ok('exportCurrentPreset writes a named .json', !!captured && /\.json$/.test(captured.name), captured && captured.name);
const pr = captured && captured.obj.presets[0];
ok('exported preset carries params + gen + eq(tap/bands)', !!pr && !!pr.params && !!pr.gen && pr.eq && pr.eq.tap === 'pre' && Array.isArray(pr.eq.bands) && typeof pr.eq.mix === 'number');
ok('exported bands carry the persistent field set', !!pr && pr.eq.bands.every(b => 'type' in b && 'slopeDbOct' in b && 'muted' in b && 'soloed' in b && b.dyn && !('_zs' in b)));
// round-trip it back through the loader
const fresh = new Component({});
fresh.applyPreset(pr);
ok('exported preset re-loads (eq tap + mix restored)', fresh.state.eqTap === 'pre' && Math.abs(fresh.P.eqMix - 0.7) < 1e-9 && Math.abs(fresh.P.eqOut + 2) < 1e-9);
ok('exported preset re-loads (params restored)', Math.abs(fresh.P.morph - c.P.morph) < 1e-9);
c.banks.user = [pr];
c.exportUserBank();
ok('exportUserBank writes the whole user bank', captured.name === 'oscisynth-user-presets.json' && captured.obj.presets.length === 1 && captured.obj.schemaVersion === 1);

console.log(fail === 0 ? '\nPARAM MODEL + A/B + EXPORT: ALL CHECKS GREEN' : '\n' + fail + ' CHECKS FAILED');
process.exit(fail ? 1 : 0);
