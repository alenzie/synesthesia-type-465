# Phase 1 — Retire ScriptProcessorNode → AudioWorklet

*(Roadmap phase 1; planned 2026-07-23 after Phase 2 completion; revised same day after a codex gpt-5.5
xhigh review — see `crosstalk_docs/2026-07-23-070744-*`. The extracted DSP core produced here IS the C++
`ProcessBlock` spec for the Phase-5 iPlug2 port.)*

## Context / why

The whole synth renders on the **main thread** in a deprecated `ScriptProcessorNode`
(`createScriptProcessor(2048,0,2)`, dc.html:506; `process(e)` at 421). Consequences: audio glitches under
UI load, a 2048-frame latency floor, deprecation risk, and DSP/UI state interleaved freely — the single
biggest divergence from the plugin architecture. Phase 1 moves rendering to an `AudioWorkletProcessor`
(128-frame quanta, audio thread) and forces the DSP/UI split the iPlug2 port needs.

Non-goals: no sound changes (verified by golden renders), no new features, no UI redesign — only the
plumbing the migration requires.

## Current entanglements (verified)

- `process(e)` (421+) reads `this.P`, `this.state` (bpm, `_eqPre`), voices, lorenz/cube state, SVF state,
  EQ runtime (`_eqPrep`/`_eqTickSub`/`_eqApply`).
- **The MIDI-file sequencer runs per-sample inside `process()`** (438–446): event dispatch, song clock,
  loop restart, and end-of-song `setPlaying(false)` (a UI call from the audio path).
- Beam: `ringX/ringY` Float32Array(16384) written per sample (332–333), read live at RAF by the scope.
- UI reads **audio-owned state beyond beam/meters**: mod view + hue-follow read voice phases/envelopes and
  active notes; analyzer curve reads live eased band params/GR (`_eqCurveSecs`, `_gr`, `_geff`); meters
  read `outPeak`/`outSq`.
- Block-size couplings to PRESERVE exactly: dynamics detector = 2048-sample accumulation window with GR
  computed once per window from the PREVIOUS window's `_acc` (`dt=2048/sr` ballistics step — the one-block
  latency is part of the sound); `_eqTickSub` easing every 128 samples.
- Allocation in the render path today (must be rewritten, not just moved): `shape()` builds/returns fresh
  arrays per voice per sample; `_eqSections` builds coefficient objects every 128-sample tick; `_zs`
  arrays of objects.
- `Math.random()` in the DSP: jitter per sample AND lorenz init in `noteOn`. (`performance.now()` is
  UI-gesture-only — not a render-path concern.)
- Single-file constraint: one `.dc.html` opened from `file://` — no separate worklet file, no COOP/COEP,
  therefore **no SharedArrayBuffer by default**.

## Workstreams (land in order, one commit each)

### W0 — Feasibility spike (gates the approach)
1. Minimal throwaway: `audioWorklet.addModule(blobURL)` + a sine processor, opened from `file://` in
   Chrome + Firefox. AudioWorklet is a secure-context API; `file://` is generally treated as potentially
   trustworthy but policy varies — prove it before refactoring. If it fails anywhere relevant, the SPN
   fallback (W2.5) becomes that browser's primary path and the plan still holds.

### W1 — Extract `SynthCore` (pure DSP, allocation-free) + golden-render harness
1. Factor everything the audio thread needs into a self-contained `SynthCore` (no DOM/window/dc-runtime/
   closure references): voice alloc + ADSR, the 10 generators, FM/tempo-sync phase math, SVF,
   fold/jitter/width, the EQ runtime, **and the MIDI-file sequencer** (song clock, event dispatch, loop —
   it is per-sample audio-rate logic and moves with the DSP; end-of-song/loop events surface as core →
   host notifications, not direct UI calls).
2. **Allocation rewrite** (the real work of W1): `shape()` writes into preallocated per-voice scratch
   (out-params/typed slots, no arrays returned); `_eqSections` fills preallocated per-band coefficient
   typed arrays (5 floats × maxSections × 14 bands) in place; section states become flat typed arrays.
   After construction/param-apply, `render` performs zero allocation.
3. **Injected PRNG**: `SynthCore` takes an RNG (default: seeded xorshift128+). Jitter AND lorenz noteOn
   init use it. Production seeds from entropy at power-on; harnesses pass a fixed seed — reproducibility
   across main-thread/worklet/C++ becomes a design property instead of a shim.
4. **Cadence counters**: detector window and easing tick run off an absolute sample counter inside the
   core (`samplePos % 2048`, `% 128`) — host block size (2048 SPN today, 128 worklet, render-quantum
   changes later) can never alter the sound.
5. API: `setParams(patch)` (atomic between blocks), `applyBands(bands)` (see W2.4), `noteOn/noteOff/
   allOff`, `loadMidi(events,bpm)/play/stop/seek`, `render(outL,outR,n)`, telemetry accessors (below).
6. **Golden-render harness** (scratchpad, node): BEFORE refactor, capture reference renders of the current
   engine (brace-extraction pattern; preset matrix incl. dynamic-EQ presets; fixed seed via the injected
   RNG retrofitted to the old path for capture; scripted note/MIDI events; 44.1k + 48k). AFTER: byte-level
   comparison — **max-abs per-sample tolerance (1e-6) in addition to RMS**, so one-sample clicks can't
   hide in an RMS average.

### W2 — The worklet host + protocol + fallback
1. **Packaging**: worklet source assembled from explicit source strings (core + processor wrapper — not a
   fragile `toString()` chain) → `Blob` → `addModule(blobURL)`. No external file; works from `file://`
   per W0.
2. **Processor**: 128-frame `process()` → `SynthCore.render`. `onmessage`: params/bands/notes/MIDI/
   transport. **`processorerror` handler on the node**: log, tear down, rebuild the node once; if it fails
   again, drop to the SPN fallback (a thrown processor is permanent silence otherwise).
3. **Ordered protocol, no stale-note races**: the port is ordered, but the params throttle isn't — so any
   note/transport/panic message **flushes pending dirty params first** (params-before-note invariant),
   and every message carries a monotonically increasing revision for debugging. Keyboard notes go
   immediate-next-quantum (fine once params flush first); MIDI-file timing is sample-accurate inside the
   core sequencer.
4. **Band identity, not band replacement**: bands get stable `id`s (assigned at creation/load).
   `applyBands` MERGES target fields into existing runtime bands by id — never recreates surviving bands —
   so `_acc/_gr/_zs` and eased `_fS/_gS/_qS` survive a 30 Hz params stream (wholesale replacement would
   reset filters and defeat the easing continuously). Adds/removes create/drop exactly the changed bands.
5. **SPN fallback**: thin ScriptProcessor host driving the SAME `SynthCore` on the main thread; selected
   when worklet is unavailable, `addModule` rejects, or the processor dies twice. One core, two hosts.
6. **Lifecycle spec**: `power(on)` = resume ctx → ensure module added once per AudioContext → create node
   → `worklet → analyser → destination` (mirrors today's 507–508) → params+bands full sync → arm. `power
   (off)` = panic → disconnect → keep node for reuse. Context recreation (device change) re-runs module
   add + full sync. Suspend/resume and sample-rate change covered in the test matrix.

### W3 — Beam, meters, and UI telemetry back to the main thread
1. **Default transport (works everywhere incl. `file://`): transferable ping-pong pool at RAF-ish
   cadence.** Chunks of **256 samples** (≈5.8 ms @44.1k, ~172 msgs/s from a pool of ~8 reusable buffer
   pairs) — the scope keeps (improves) its current visual freshness: today RAF sees samples up to one
   2048 block (~46 ms) old, here chunks land ≤6 ms after render. Message rate is well within postMessage
   budget for 2 KB transferables. Main thread copies into `ringX/ringY` (scope code untouched) and
   returns buffers to the pool.
   **Backpressure policy (explicit): audio never waits.** If the pool is empty (main thread stalled), the
   worklet drops beam chunks — visual data is droppable, audio is not; no allocation, no blocking.
2. **Telemetry mailbox** (same messages, small typed array): out peak/sumSq, per-band GR + eased
   freq/gain/Q (analyzer curve + GR ticks stay display==sound), per-voice envelope/phase summary + active
   notes (mod view + hue-follow), sequencer state (song time, playing/ended — replaces the in-render
   `setPlaying(false)` UI call). UI-side consumers read the latest mailbox at RAF exactly like today's
   fields; enumerated one-for-one in the workstream so nothing goes silently stale.
3. **SAB upgrade path**: when `crossOriginIsolated`, swap the pool for a lock-free SharedArrayBuffer ring
   (ringbuf.js pattern) for beam + telemetry. Feature-detected; both paths share the accumulate/publish
   code. COOP/COEP stays a hosted-deploy concern (roadmap risk already notes it).

### W4 — Integration + perf pass
1. Store writes (`setParam` sites, preset load, undo apply, MUTATE frames, band edits) mark dirty →
   throttled params post (latest-wins) + the W2.3 flush-before-note invariant. MUTATE's 30 Hz animation
   coalesces naturally.
2. Perf: DevTools allocation profile of the worklet (zero steady-state), CPU headroom at 10 voices × 14
   bands × 4 sections, audio glitch test under deliberate UI abuse (drag storm + RAF) — the point of the
   phase.
3. Roadmap: tick Phase 1; record the W0 result, fallback conditions, and the SAB criteria; update the
   architecture diagram.

## Risks
- `file://` + blob `addModule` variance → W0 spike first; SPN fallback keeps every browser working.
- Transferable-pool GC: pooled buffers are reused, messages themselves are small; profile in W4.
- Latency improves (2048 → 128) — MIDI-file behavior identical (sequencer moved wholesale); keyboard notes
  gain up to one quantum of extra promptness, not less.
- Determinism: injected PRNG makes parity testable; production behavior unchanged (entropy seed).

## Verification
1. Golden-render equivalence (W1): old engine vs `SynthCore`, preset matrix × {44.1k, 48k}, scripted
   events, fixed seed — RMS < 1e-6 AND max-abs per-sample < 1e-6.
2. Host-equivalence (W2): `SynthCore` in 2048-blocks vs 16×128-blocks, identical events — bit-identical
   output (absolute-counter cadences make this exact by design).
3. Faust parity harness rerun (engine math untouched).
4. `node --check` per commit (existing pattern).
5. Manual matrix: `file://` Chrome + Firefox worklet path; forced-SPN fallback flag; power cycles; preset
   load mid-play; MUTATE while playing; EQ drag storm (no glitches); EQ→SCOPE toggle; MIDI file incl.
   loop + end-stop; keyboard; meters/GR/mod-view/hue live; suspend/resume; output-device / sample-rate
   change; DevTools performance + allocation recording.
