# Verification harnesses (headless, node)

All run against the live `OsciSynth Type 465.dc.html` (most default to `../OsciSynth Type 465.dc.html`;
pass a path as argv to target another revision, e.g. `git show <rev>:'OsciSynth Type 465.dc.html' > /tmp/old.html`).

Install deps once in this directory: `npm i` (playwright-core + @grame/faustwasm). Browsers:
`npx playwright install chromium firefox`.

| Harness | What it proves |
|---|---|
| `browser-pass.js [file-url] [--chromium\|--firefox]` | Real headless browsers (BOTH by default): app mounts from `file://`, AudioWorklet engages (data:-URL module), audio/beam/telemetry flow, note round-trip, EQ add + undo, FAUST download, forced-SPN fallback (`__osci._forceSPN`) + worklet restore, clean power-off, zero page errors. 13 checks per engine. |
| `golden.js <html> <prefix>` + `golden-compare.js` | Seeded golden renders (drone + dynamic EQ, MIDI + lorenz + pre-tap, keys + generator swaps; 44.1k/48k). Capture from two revisions and diff — the engine-didn't-change proof (max-abs + exact-match %). |
| `block-equiv.js <html>` | `SynthCore` rendered in 2048-blocks vs 128-blocks is bit-identical (absolute-counter cadences are host-block independent). |
| `worklet-equiv.js <html>` | The REAL worklet module source + REAL message protocol in a fake `AudioWorkletGlobalScope` vs the ScriptProcessor path: bit-identical audio and beam (X and Y), plus pool-starvation backpressure (chunks drop, audio survives). |
| `param-model-check.js [html]` | Parameter model: descriptor coverage, real↔normalized round-trip, log/pow skew shape, discrete choices, formatting; A/B compare semantics; preset export → loader round-trip. |
| `precision-check.js [html]` | No premature quantization: continuous params (Hz, times, gains) keep full double precision through `_clampParam`/`fromNorm`/chip drags; only enumerated params snap; BPM accepts decimals; every tempo division is exact at a fractional BPM; values survive the worklet patch hop bit-for-bit; a 0.001 Hz difference is resolvable in the phase accumulator. |
| `make-loops.js` / `loop-check.js` | Reference drum loops: builds `assets/loops.js` (gitignored base64 bundle, so loops work from `file://`) with tempo + beat count parsed from the filename and the loop length DERIVED from tempo × beats; the checker verifies decode, exact-musical loop points, stretch rate, tempo-stop, downbeat re-alignment and signal-path isolation in both engines. |
| `gen-dsp.js <html> <out.dsp>` + `parity-check.mjs [html]` | FAUST export: worst-case band sets (all types, slopes 24/48/96, tilt, depth notch, mute/solo, empty, solo-only) compile under faustwasm, and the emitted DSP matches the live engine numerically in double precision. |

Typical full sweep:

```bash
cd tools
node param-model-check.js
node block-equiv.js "../OsciSynth Type 465.dc.html"
node worklet-equiv.js "../OsciSynth Type 465.dc.html"
node gen-dsp.js "../OsciSynth Type 465.dc.html" /tmp/eq.dsp && node parity-check.mjs
node browser-pass.js          # chromium + firefox
```

Golden comparison across a change:

```bash
git show HEAD~1:'OsciSynth Type 465.dc.html' > /tmp/old.html
node golden.js /tmp/old.html ref && node golden.js "../OsciSynth Type 465.dc.html" cand && node golden-compare.js
```
