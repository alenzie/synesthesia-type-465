// Engine stability sweep — the filter must not diverge ANYWHERE in its parameter space.
//
// Origin: LFO -> CUTOFF at 100% depth produced an ear-piercing screech. Root cause was not the LFO:
// the Chamberlin state-variable filter was being engaged past its stability bound. With state matrix
// trace T = 2 - f^2 - f*q and determinant D = 1 - f*q, both poles stay inside the unit circle only
// while f < sqrt(q^2+4) - q. The old ceiling (fc <= 0.24*sr) allowed f = 1.369 at zero resonance
// against a limit of 1.236, so the filter diverged and the |svL| > 8 guard reset it every few
// samples — a reset storm, audible as broadband screech. A single-setting test would have missed the
// static-cutoff case, so this sweeps the space.
//
// Usage: node engine-stability-check.js [html-file]
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.resolve(__dirname, '..', 'OsciSynth Type 465.dc.html');
const html = fs.readFileSync(file, 'utf8');
const sm = /<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(html);
class DCLogic { constructor(){ this.state={}; this._refs={}; } setState(o){ Object.assign(this.state,o); } }
global.window = { SYNESTHESIA_BANKS: {} };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const Component = new Function('DCLogic', sm[1] + '\nreturn Component;')(DCLogic);

let fail = 0;
const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS' : 'FAIL') + '  ' + n + (d ? '  — ' + d : '')); };

function render(setup, sr = 44100, blocks = 12) {
  const c = new Component({});
  c.ctx = { sampleRate: sr }; c.running = true;
  c.state.gen = 'lissajous'; c.state.drone = true; c.state.bpm = 174;
  c.P.baseFreq = 55;
  setup(c);
  const N = 2048 * blocks, out = new Float32Array(N);
  for (let b = 0; b < blocks; b++) {
    const l = new Float32Array(2048), r = new Float32Array(2048);
    c.process({ outputBuffer: { getChannelData: ch => ch === 0 ? l : r } });
    out.set(l, b * 2048);
  }
  let jumps = 0, worst = 0, nan = 0, peak = 0;
  for (let i = 0; i < N; i++) { if (!isFinite(out[i])) nan++; const a = Math.abs(out[i]); if (a > peak) peak = a; }
  for (let i = 1; i < N; i++) { const d = Math.abs(out[i] - out[i - 1]); if (d > 0.25) jumps++; if (d > worst) worst = d; }
  return { jumps, worst, nan, peak };
}

// 1. the exact reported case
{
  const r = render(c => { c.P.cutoff = 18000; c.P.reso = 0; c.P.lfoTarget = 2; c.P.lfoDepth = 1; c.P.lfoSync = true; c.P.lfoDivision = 6; });
  ok('reported case: LFO->CUTOFF @100% depth does not diverge', r.jumps === 0 && r.nan === 0, `${r.jumps} discontinuities, worst ${r.worst.toFixed(3)}`);
}
// 2. the same bug reachable WITHOUT the LFO (static high cutoff, low resonance)
{
  const r = render(c => { c.P.cutoff = 17800; c.P.reso = 0; });
  ok('static high cutoff at zero resonance does not diverge', r.jumps === 0 && r.nan === 0, `${r.jumps} discontinuities`);
}
// 3. FULL SWEEP of the cutoff x resonance space, at several sample rates, with and without LFO.
//    This is the check that would have caught the original bug immediately.
{
  const rates = [44100, 48000, 96000];
  const cutoffs = [60, 200, 800, 2000, 5000, 9000, 12000, 15000, 17899, 18000];
  const resos = [0, 0.001, 0.1, 0.5, 0.9, 0.96, 1];
  let worstJumps = 0, worstCase = '', cases = 0, nanCases = 0;
  for (const sr of rates) for (const co of cutoffs) for (const rs of resos) for (const lfo of [0, 1]) {
    cases++;
    const r = render(c => {
      c.P.cutoff = co; c.P.reso = rs;
      if (lfo) { c.P.lfoTarget = 2; c.P.lfoDepth = 1; c.P.lfoSync = true; c.P.lfoDivision = 6; }
    }, sr, 6);
    if (r.nan) nanCases++;
    if (r.jumps > worstJumps) { worstJumps = r.jumps; worstCase = `sr=${sr} cutoff=${co} reso=${rs} lfo=${lfo} -> ${r.jumps} jumps, worst ${r.worst.toFixed(3)}`; }
  }
  ok(`filter is stable across the whole space (${cases} combinations)`, worstJumps === 0, worstCase || 'no divergence anywhere');
  ok('no NaN/Inf anywhere in the sweep', nanCases === 0, nanCases + ' cases');
}
// 4. resonance must still DO something (the clamp must not have flattened the filter).
// Output PEAK is a poor probe here — the output tanh compresses it — so compare the waveforms
// directly: if resonance were inert the two renders would be identical.
{
  const wave = (setup) => {
    const c = new Component({});
    c.ctx = { sampleRate: 44100 }; c.running = true;
    c.state.gen = 'lissajous'; c.state.drone = true; c.P.baseFreq = 55; c.P.jitter = 0; setup(c);
    const N = 2048 * 8, out = new Float32Array(N);
    for (let b = 0; b < 8; b++) { const l = new Float32Array(2048), r = new Float32Array(2048);
      c.process({ outputBuffer: { getChannelData: ch => ch === 0 ? l : r } }); out.set(l, b * 2048); }
    return out;
  };
  const rmsOf = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
  const dry = wave(c => { c.P.cutoff = 800; c.P.reso = 0; });
  const wet = wave(c => { c.P.cutoff = 800; c.P.reso = 0.93; });
  const diff = new Float32Array(dry.length);
  for (let i = 0; i < dry.length; i++) diff[i] = wet[i] - dry[i];
  const rel = rmsOf(diff) / rmsOf(dry);
  ok('resonance still shapes the sound after the clamp', rel > 0.05, `waveform differs by ${(rel * 100).toFixed(1)}% rms`);

  // and a HIGH cutoff, where the clamp IS active, must still be a working low-pass rather than a
  // bypass: filtered output must differ from the unfiltered generator.
  const openF = wave(c => { c.P.cutoff = 17800; c.P.reso = 0; });          // filter engaged + clamped
  const bypass = wave(c => { c.P.cutoff = 18000; c.P.reso = 0; });         // fltOn false -> no filter
  const d2 = new Float32Array(openF.length);
  for (let i = 0; i < openF.length; i++) d2[i] = openF[i] - bypass[i];
  ok('the clamped high cutoff still filters (not a silent bypass)', rmsOf(d2) / rmsOf(bypass) > 0.001,
     `differs from bypass by ${(rmsOf(d2) / rmsOf(bypass) * 100).toFixed(2)}% rms`);
}
// 4b. EQ dynamics ballistics must be symmetric: ATTACK while the gain movement grows, RELEASE while
// it returns to 0. Testing `target < current` only works downward — with mode='up' the target is
// POSITIVE, so engaging picked RELEASE and letting go picked ATTACK. Goldens never caught this
// because they never drive an upward band past its threshold.
{
  const ramp = (mode) => {
    const c = new Component({}); const core = c.core; core.sampleRate = 48000;
    const dyn = { on: true, mode, threshDb: -60, ratio: 4, rangeDb: 12, attackMs: 2, releaseMs: 3000 };
    core.eqBands = [{ type: 'bell', freqHz: 1000, gainDb: 0, q: 1, on: true, slopeDbOct: 12, muted: false, soloed: false, dyn }];
    const gr = [];
    for (let b = 0; b < 12; b++) { core.eqBands[0]._acc = 2048 * 0.0625; core._eqPrep(48000, 2048); gr.push(core.eqBands[0]._gr); }
    return gr;
  };
  const blocksTo63 = (a) => { const t = Math.abs(a[a.length - 1]) * 0.63; for (let i = 0; i < a.length; i++) if (Math.abs(a[i]) >= t) return i + 1; return 99; };
  const up = ramp('up'), dn = ramp('down');
  ok('downward dynamics engage at the ATTACK rate', blocksTo63(dn) === 1, blocksTo63(dn) + ' block(s)');
  ok('UPWARD dynamics engage at the attack rate too (not release)', blocksTo63(up) === 1, blocksTo63(up) + ' block(s)');
  ok('both directions reach their full range', Math.abs(dn[11] + 12) < 0.01 && Math.abs(up[11] - 12) < 0.01,
     `down ${dn[11].toFixed(2)} up ${up[11].toFixed(2)}`);
  // and releasing must be SLOW for both
  const release = (mode) => {
    const c = new Component({}); const core = c.core; core.sampleRate = 48000;
    const dyn = { on: true, mode, threshDb: -60, ratio: 4, rangeDb: 12, attackMs: 2, releaseMs: 3000 };
    core.eqBands = [{ type: 'bell', freqHz: 1000, gainDb: 0, q: 1, on: true, slopeDbOct: 12, muted: false, soloed: false, dyn }];
    core.eqBands[0]._acc = 2048 * 0.0625; core._eqPrep(48000, 2048);       // engage
    const peak = core.eqBands[0]._gr;
    core.eqBands[0]._acc = 0; core._eqPrep(48000, 2048);                    // signal gone
    return Math.abs(core.eqBands[0]._gr) / Math.abs(peak);                  // fraction still held
  };
  ok('both directions RELEASE slowly (release time honoured)', release('down') > 0.9 && release('up') > 0.9,
     `down ${release('down').toFixed(3)} up ${release('up').toFixed(3)} of peak retained after one block`);
}

// 5. the stability bound itself, checked directly against the pole condition
{
  let violations = 0;
  for (let rs = 0; rs <= 1.0001; rs += 0.02) {
    const qd = 1 - Math.min(0.96, rs);
    const fMax = 0.95 * (Math.sqrt(qd * qd + 4) - qd);
    const T = 2 - fMax * fMax - fMax * qd, D = 1 - fMax * qd;
    if (!(Math.abs(T) < 1 + D && Math.abs(D) < 1)) violations++;
  }
  ok('the clamp value satisfies the pole condition at every resonance', violations === 0, violations + ' violations');
}

console.log(fail === 0 ? '\nENGINE STABILITY: ALL CHECKS GREEN' : '\n' + fail + ' CHECKS FAILED');
process.exit(fail ? 1 : 0);
