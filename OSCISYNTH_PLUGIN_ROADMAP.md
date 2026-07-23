# OsciSynth Type 465 — Plugin Roadmap & Build Checklist

**Goal:** grow the current single-file web synth into an FL Studio plugin, adding host-tempo FM sync, an
EQ spectrograph + FabFilter-style dynamic EQ, presets, and 75-step undo/redo — with an "Export FAUST"
button shipped before the plugin work.

Derived from a 6-agent discovery pass (web best-practices + codebase audit) and a 14-question owner interview.
Un-interviewed details use a stated **default** you can override.

---

## 0. Locked decisions (owner interview)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Plugin framework | **iPlug2** (MIT/free) → native VST3 + CLAP for FL Studio |
| 2 | Plugin category | **Instrument only** (VSTi); EQ + spectrograph process the synth's own output |
| 3 | EQ ↔ oscilloscope | **Toggle** — an "EQ affects visuals" switch chooses pre-tap (reshapes beam) vs post-tap (audio-only) |
| 4 | EQ/audio engine | **Portable DSP math module in an AudioWorklet** — full dynamic bands, retires ScriptProcessorNode, ports to C++ verbatim |
| 5 | Dynamic bands | Full dynamics **with a Ratio knob** → 8 params/band |
| 6 | Band count | **Add/remove freely** (Pro-Q style) — dynamic band array + fixed low-cut/high-cut ends |
| 7 | Dynamics detector | **Per-band frequency-selective** (each band bandpass-taps its own Freq/Q) |
| 8 | Analyzer controls | **Fixed defaults + Freeze** toggle only |
| 9 | Second visual mode | **Toggle** scope ↔ analyzer; analyzer view **is** the EQ view |
| 10 | Band knob row | **Always show all 8** knobs for the selected band |
| 11 | Presets | **Combined synth patch** (synth + its EQ) **+ a separate layerable EQ-only bank** (swaps only the EQ) |
| 12 | Export FAUST | Button exports the **EQ / filters** as a compilable `.dsp` |
| 13 | Param store / undo | One unified `setParam(id, value, {gesture})` store; **75-step FIFO undo, one entry per gesture** |
| 14 | Tempo sync | `fmSync` + `fmDivision` on the FM-RATE knob; MIDI-file tempo now, host tempo in the plugin |

### Applied defaults (override anytime)
- **EQ phase:** minimum-phase / zero-latency biquads only for v1 (linear-phase deferred; incompatible with per-band dynamics anyway).
- **Dynamics direction:** downward (compress) by default; **Range** clamps the max dB of movement; a per-band sign/mode can add upward later.
- **Per-band "M/S" labels:** interpreted as **Mute + Solo** (renamed to avoid the Pro-Q Mid/Side collision). Mid/Side *placement* deferred.
- **Filter types per band:** Bell (peaking), Low Shelf, High Shelf, Low Cut (12/24/48/96 dB/oct), High Cut, Notch, Band Pass.
- **Plugin formats:** VST3 + CLAP, Windows-first (FL). AU only if macOS/Logic is ever a target.
- **Tempo divisions:** one ordered enum incl. dotted/triplet (1/1 … 1/64), quarter-note reference (not meter-aware).
- **Undo scope:** every parameter *and* discrete control (generator, mode toggles, band add/delete); preset load / MUTATE / Full Reset each = one step; history kept across loads.

---

## 1. Architecture at a glance

**Now (browser):** `OsciSynth Type 465.dc.html` — the audio engine is **`SynthCore`**, a self-contained
class rendering inside an **AudioWorklet** (128-frame quanta; ScriptProcessor fallback drives the same core
when worklets are unavailable). The UI `Component` talks to it via an ordered patch/note protocol and reads
telemetry mirrored into a local core instance. Output L/R **is** the oscilloscope X/Y beam.

**Target (browser, refactored):**
```
[AudioWorklet: synth DSP] → (beam tap, switchable) → [AudioWorklet: EQ cascade] → out
                                     ↓                          ↓
                              ringX/ringY → scope        Analyser/FFT → spectrograph
              one setParam() store  ⇄  UI (knobs, draggable EQ handles)  ⇄  75-step undo + presets
```

**Target (plugin, iPlug2):** the two AudioWorklet DSP modules become one C++ `ProcessBlock`; the HTML/canvas
visuals load in iPlug2's WebView; the JS param store is re-implemented as iPlug2 `IParam`s + state chunks +
a hand-built 75-step undo (iPlug2 has no `APVTS`/`UndoManager`). Host tempo via `ITimeInfo`/`GetTempo()`.

**Key reality:** the synth *generates* the beam as audio — filtering the output also reshapes the on-screen
figure. That's why decision #3 is a toggle, and why the beam tap point is switchable.

---

## 2. Phased checklist

### Phase 0 — Parameter store + undo/redo + presets  *(foundation; everything rides on it)*
- [ ] Upgrade `this.CTLS` tuples into a **ParameterModel**: `{id, label, section, min, max, step, default, skew, unit, format, toNorm, fromNorm, isDiscrete, choices}`.
- [ ] Build a **ParamStore** whose live values object *is* `this.P` (so `process()` + `renderVals()` keep reading it unchanged): `setValue(id, real, {gesture, source})`, `getNormalized/setNormalized`, `beginGesture(ids)/endGesture()`, `snapshot()/applySnapshot()`.
- [ ] Route **every** write through it: `dialDown`, `masterDown`, `mutate()`, generator select, and the future EQ handle drags + wheel-Q. No direct `this.P[id]=` left.
- [ ] **75-step FIFO undo ring**: one command `{before, after, label}` pushed per gesture on `endGesture`. `mutate()` / preset load / Full Reset each bracket all touched ids as **one** step. Add Undo/Redo buttons (the `↩ ↪` in the mockup).
- [ ] Model `master` and `gen` (generator, discrete) as first-class params; keep transport/session state (power, playing, octBase, loop, MIDI, hueFollow) **out** of presets.
- [ ] **Presets**: JSON `{name, version, schemaVersion, params:{id:value}, meta}`. localStorage catalog + `.json` import/export. Versioning + default-fill (missing id → descriptor default) so future params don't break old presets.
- [ ] **Preset browser** (mockup top bar): dropdown, A/B compare, prev/next arrows, "Full Reset" default, dirty asterisk (`currentSnapshot != loadedSnapshot`).
- [ ] Real-units canonical values + per-param `toNorm/fromNorm` skew (frequency = log) — this is what host automation consumes later.

### Phase 1 — Retire ScriptProcessorNode → AudioWorklet  *(prereq for dynamic EQ + the C++ port)*
- [x] Move the engine into an `AudioWorkletProcessor` *(done 2026-07-23: the whole engine is `SynthCore` — one pure, allocation-light class with injected RNG and absolute-counter cadences (2048 detector window / 128 easing, host-block independent); serialized into a blob worklet module at runtime; verified BIT-IDENTICAL to the pre-refactor engine via 4-scenario golden renders and to the SPN path via a headless protocol harness)*.
- [x] Beam samples → UI *(done via 256-sample transferable ping-pong pool + telemetry mailbox written into the local core mirror — works from `file://` with no COOP/COEP; drop-not-block backpressure. SharedArrayBuffer ring remains a hosted-deploy upgrade path when `crossOriginIsolated`)*.
- [x] Audio-thread / UI-thread split forced *(ordered patch/note protocol with params-before-note flush, stable band-id merge; ScriptProcessor kept as an automatic fallback driving the SAME SynthCore — one core, two hosts)*.
- [x] Browser pass — AUTOMATED via Playwright (`tools/browser-pass.js`, 13 checks, headless **Chromium + Firefox both ALL-GREEN** from `file://`): worklet engages (the W0 spike found Chromium rejects blob: worklet modules on file:// — fixed with a data:-URL module), audio/beam/telemetry flow, note round-trip, EQ+undo, FAUST download, forced-SPN fallback + worklet restore, clean power-off, zero page errors. Remaining for the owner: an EARS pass (sound quality / glitch feel under real interaction). Detail: `PHASE1_WORKLET_PLAN.md`.

### Phase 2 — EQ + spectrograph  *(the big feature)*
- [x] **Portable biquad module** *(done: `_eqCoeffs` + `_eqSections` — Butterworth-staggered cuts 12/24/48/96, real ±g/2 tilt, depth notch)* (framework-agnostic pure math): `computeCoeffs(type, freq, Q, gainDb, Fs)` (RBJ cookbook) + **TDF-II** per-sample `process`. Butterworth-**staggered Q** for cut slopes (12/24/48/96 dB/oct). `Fs`-parametric (host rate varies).
- [x] **Band array**: `bands[i] = {type, freq, Q, gainDb, on, dynOn, rangeDb, threshDb, ratio, attackMs, releaseMs, muted, soloed}`. Add via double-click spectrum, delete via drag-off. Fixed low-cut/high-cut ends.
- [x] **Per-band dynamic detector** (frequency-selective): bandpass-tap the signal at the band's Freq/Q → rectify → branching attack/release envelope (reuse the file's existing `aC/rC` ballistics, lines 281/303) → dB. Gain reduction = `(levelDb - threshDb) * (1 - 1/ratio)`, clamped to `Range`, applied as a dB offset to the band's static Gain. Smooth in the **dB domain**.
- [x] **Coefficient smoothing** (per-block recompute + ramp / crossfade) so dragging Freq/Q/Gain doesn't zipper.
- [x] **Switchable tap point** (decision #3): "EQ affects visuals" on → insert before the `ringX/ringY` write; off → after (audio-only). Default off.
- [x] **MIX** = parallel dry/wet `(1-mix)*dry + mix*wet`; **OUT** = post-EQ dB trim. Per-band on/off, band bypass, Mute/Solo. EQ master power toggle.
- [x] **Analyzer view = EQ view**: toggle swaps the beam canvas for grid + filled spectrum + composite curve; all-8-knob band row below.
  - [x] Spectrum: AnalyserNode tap now (fixed FFT 4096, smoothing 0.8, +4.5 dB/oct tilt, 90 dB range, log 20 Hz–20 kHz) + **Freeze**/peak-hold.
  - [x] **Curve from the same coeffs** the audio uses (RBJ magnitude formula, no FFT) → display always equals sound. Per-band colored fills between the band's dB curve and 0 dB. Dynamic bands: static curve + translucent ghost spanning Gain…Gain±Range.
  - [x] **Draggable numbered handles** as DOM over canvas: X↔freq (log), Y↔gain, wheel↔Q, double-click↔reset. Each drag = **one undo gesture** (Phase 0).
  - [x] Axis math: `freqToX(f)=padL+W*(log10(f)-1.301)/3`; `xToFreq(x)=10^(1.301+3*(x-padL)/W)`; `gainToY(dB)=padT+Hh*(R-dB)/(2R)`.
- [x] EQ-only preset bank (decision #11): loading one replaces only the `bands[]` params, synth untouched.

### Phase 3 — Tempo sync
- [ ] Add `fmSync` (bool, default false) + `fmDivision` (int index) to the param model (so presets + undo capture them free).
- [ ] Division table (slow→fast): `1/1, 1/2., 1/1T, 1/2, 1/4., 1/2T, 1/4, 1/8., 1/4T, 1/8, 1/16., 1/8T, 1/16, 1/16T, 1/32, 1/32T, 1/64`. Default `1/4`.
- [ ] Engine: at the FM phase step, `fmHz = fmSync ? (bpm/60)/FM_DIVS[fmDivision].beats : fmRate`. Dotted ×2/3 rate, triplet ×3/2.
- [ ] BPM source (standalone): capture MIDI-file tempo (`this.midiBpm = 60000000/usPerQ` — one line where it's currently discarded) + a **manual BPM field** (default 120) for droning with no MIDI.
- [ ] FM-RATE knob reuse: formatter shows Hz or the division label; `dialDown` steps an int index when synced. MUTATE leaves `fmSync` off.
- [ ] *(Plugin)* swap `bpm` for host tempo; SYNC mode derives phase from host ppq (grid-lock). Free-run for standalone/now.

### Phase 4 — Export FAUST button
- [x] Generate a `.dsp` for the **EQ / filter chain** from the current band array: RBJ biquads (same `_eqCoeffs` math, `ma.SR`-aware) as a serial `fi.tf22t` cascade, per-band frequency-selective dynamics (band-pass sidechain → ~46 ms RMS → dB-domain attack/release), MIX + OUT. Parameterized by the live band values (hsliders, grouped per band).
- [x] Wire the "Export FAUST" button (↓ FAUST in the EQ BANDS row, analyzer view) + a download. *(Scope is the EQ, per decision #12 — not the geometric synth engine, which doesn't map cleanly to Faust.)*
- [x] *(Optional)* validate the emitted `.dsp` compiles — verified against Faust 2.86.2 (faustwasm): all band types + dyn variants compile; rendered output matches the app's biquad to 0.00000 dB at a +6 dB bell test.

### Phase 5 — iPlug2 plugin port (FL Studio VST3 + CLAP)
- [ ] Scaffold from the **iPlug2OOS** out-of-source template; targets VST3 + CLAP (+ standalone).
- [ ] **Hand-transliterate** the AudioWorklet DSP (`process` + 10 `shape` generators + voice alloc + the EQ module) to a C++ `ProcessBlock`. Line-by-line — preserves the exact sound. Watch the stateful `lorenz` ODE + `cube` tour table.
- [ ] Real-time safety: no allocation/locks in `ProcessBlock`; atomic param reads.
- [ ] **WebView UI**: serve the HTML/canvas visuals from embedded resources; **drop the DC runtime** (CDN React + eval — useless in a plugin); rebind every knob + EQ handle to iPlug2 `IParam`s.
- [ ] Hand-build what iPlug2 lacks vs JUCE: parameter registration, **state chunks** (`SerializeState/UnserializeState`), the preset system, and the **75-step undo** (custom stack — the Phase-0 JS design is the spec).
- [ ] Host MIDI from the plugin's MIDI queue → `noteOn/noteOff`; host tempo via `ITimeInfo`/`GetTempo()` in `ProcessBlock` (drives Phase-3 sync).
- [ ] Beam samples: audio thread → UI via a lock-free FIFO surfaced to the WebView.
- [ ] Validate in FL Studio (Fruity Wrapper), test automation + project save/reload (state chunk round-trip).

---

## 3. Open items / risks
- **COOP/COEP headers** for SharedArrayBuffer in the browser build (Phase 1). Moot in the plugin.
- **iPlug2 = more hand-built plumbing** than JUCE (no `APVTS`/`UndoManager`/`juce::dsp`). Accepted for the MIT license; the JS param/undo/preset/EQ designs above are written to be the C++ spec so it's a port, not a redesign.
- **Dynamics direction** (downward vs bidirectional) + **Range sign** semantics — confirm during Phase 2.
- **Add/remove-bands** UI + variable band count adds state/layout complexity vs a fixed 6+2.
- **EQ-on-the-beam** (visuals toggle on) can turn a clean figure to mush under heavy filtering — a feature, but document it.

## 4. Key references
- RBJ Audio-EQ-Cookbook (biquad coeffs): https://webaudio.github.io/Audio-EQ-Cookbook/audio-eq-cookbook.html
- Biquad magnitude-from-coeffs: https://www.musicdsp.org/en/latest/Analysis/186-frequency-response-from-biquad-coefficients.html
- Dynamic-range / envelope math (Giannoulis, Massberg, Reiss 2012): https://www.aes.org/e-lib/download.cfm?ID=16354
- TDR Nova (dynamic-EQ reference model): https://docs.tokyodawn.net/nova-manual/
- iPlug2 (framework + web UI + CLAP): https://iplug2.github.io/  ·  https://github.com/iplug2/iplug2
- FL Studio supported formats: https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/plugins_supported.htm
- AudioWorklet design pattern + ring buffer: https://developer.chrome.com/blog/audio-worklet-design-pattern/ · https://github.com/padenot/ringbuf.js/
- FabFilter Pro-Q analyzer conventions: https://www.fabfilter.com/help/pro-q/using/analyzer
- Faust packaging tools: https://faustdoc.grame.fr/manual/tools/

---

## 5. Decision updates — interview session 2

Supersedes the matching rows/defaults above where they differ.

| Topic | Updated choice |
|-------|----------------|
| Dynamics direction | **Bidirectional + mode** per band (up/down) → 9 per-band controls (Freq, Q, Gain, Range, Threshold, Attack, Release, Ratio + dyn-mode) |
| Filter types | **Full per-band type menu** — every band (ends included) can be bell / low-shelf / high-shelf / low-cut / high-cut (w/ slope) / notch / band-pass / tilt |
| Undo scope | **Everything** — continuous drags AND discrete actions (generator select, mode toggle, band add/delete, preset load, MUTATE); each = one step; power/transport excluded |
| Browser app | **Stepping-stone** to the plugin — minimal browser-only polish, all effort kept portable to the iPlug2 C++ port |
| Max bands | **12** + fixed low/high end slots |
| Per-band M/S | **Both** — Mute+Solo now; add L/R/M/S stereo placement later (implies a Mid/Side EQ path down the line; note the L=X,R=Y beam interaction) |
| EQ default state | **Empty, EQ on, Mix 100%** (empty = flat, no surprise coloring) |
| MUTATE (randomize) | **Synth params only** — never the EQ; becomes one undo step |
| Param ranges | **Mockup values with sane caps** (e.g. Q ~30 not 60; Gain ±18/±24) |
| Interaction | **Pro set** — shift = fine drag, double-click = reset, right-click = context menu (type/remove/reset), scroll = Q on handles / value on knobs |
| Metering | **Full output peak/RMS meter + per-band gain-reduction meters**, AND keep the existing simple VU but shrink + relocate it (owner arrow → the empty panel slot beside SIGNAL GENERATOR) |
| Factory presets | **Full library, keep-variety** — `PRESET_LIBRARY_SPEC.md` (prose + taxonomy) + **`presets.json`** = **89 numeric presets** (54 combined-patch + 35 eq-only-bank), all research kept, only 1 genuine param near-twin dropped (Metallic Bloom Tamer ≈ Soothe-Scope). Schema v1: per-preset `synth{}` + `eq{mix,outDb,bands[{type,freqHz,gainDb,q,slopeDbOct,on,dyn{on,mode,threshDb,ratio,rangeDb,attackMs,releaseMs}}]}`. Loads into the Phase-0 preset system (migrate IDs when the param model locks) |

**Layout note (from the annotated screenshot):** move the top-right VU meter down into the empty panel area
to the right of the SIGNAL GENERATOR / generator-description row, at a smaller size, to free top-right space.

**Further-research preset bank (separate):** `presets_further_research.json` — **134 FRONT-END-first presets
across 20 artists** (all combined-patches with a real synth block; ~60 pure front-end, ~74 with a light
optional EQ). Built over 3 rounds:
- Rounds 1–2 (QGR + adds, ~6–8 each): Champagne Drip, sumthin sumthin, Tvboo, ATLiens, Jon Casey, Leotrix, TYNAN, Oski, UZ, NITEPUNK, Tsuruda.
- Round 3 (7 each): QUIX, GANZ, What So Not, Mr. Carmack, Alleycvt, Skrillex, INZO, Lane 8, Hamdi.
Distinct bank from the main factory library. Agent-authored, **untested by ear**. Affiliation notes stored in
the file's `artistNotes`. Not-QGR: NITEPUNK, Tsuruda, What So Not, Mr. Carmack, INZO, Lane 8, Hamdi, Alleycvt,
Skrillex (own thing); Champagne Drip now Wakaan. "ALLEYCAT?" resolved to **ALLEYCVT**. (Skrillex also appears
EQ-led in the main library — different emphasis, different bank.)

