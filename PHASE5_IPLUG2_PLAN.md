# Phase 5 — iPlug2 plugin port (FL Studio; VST3 first, CLAP fast-follow)

*(Roadmap phase 5; planned 2026-07-23, revised same day after a codex gpt-5.5 xhigh review — see
`crosstalk_docs/2026-07-23-071351-*`. Depends on Phase 1: the extracted `SynthCore` — allocation-free,
injected PRNG, absolute-counter cadences — is the port spec and the golden-test prerequisite. Windows-
first; built with native VS2022/MSVC, not the WSL toolchain.)*

## Context / why

Locked decisions: iPlug2 (MIT), instrument-only VSTi, VST3 + CLAP, FL Studio validation host, WebView UI,
hand-built parameter store / state chunks / 75-step undo, host tempo via `ITimeInfo`. The browser app is
the reference implementation: param model, preset schema v1, undo semantics, and the EQ engine all have
exact JS implementations with headless harnesses.

**V1 scope cuts (owner can override):** VST3 ships first, CLAP lands once the VST3/WebView/state path
survives FL (FL supports CLAP only from 2024.1 — both get validated separately, P5). Faust export stays a
web-app feature for plugin v1 (WebView download paths deferred). `presets_further_research.json` (134
agent-authored, untested-by-ear presets) ships hidden/optional — factory = the audited 89.

## Workstreams

### P0 — Scaffold + toolchain
1. `plugin/` from the **iPlug2OOS** template; iPlug2 (+ CLAP SDK for the later target) as submodules;
   targets: VST3 + Standalone now, CLAP target configured but gated. VS2022 x64. `BUILD.md` records MSVC/
   SDK versions and steps.
2. **Identity + deploy from day one**: stable Mfr/Plug UIDs, version scheme, VST3 deploy to the standard
   `Common Files\VST3` location (FL scans standard paths; iPlug2's default per-user deploy is not enough)
   — an install script now, a real installer + signing decision recorded as a P5 deliverable.
3. Skeleton passes `VST3 validator` clean and loads/null-renders in FL (Fruity Wrapper). Validators stay
   green every workstream.

### P1 — `SynthCore` → C++ (a port, not a redesign)
1. Transliterate the Phase-1 `SynthCore` to `SynthCore.hpp/cpp` (plain C++17, no iPlug2 types): voices/
   ADSR, 10 generators (lorenz in double precision), FM/tempo-sync, SVF, fold/jitter/width, EQ runtime
   (sections, Butterworth stagger, tilt, depth notch, 2048-window block-RMS detector, 128-sample eased
   coefficients — all on absolute sample counters), MIDI sequencer, beam/meter taps, **the injected PRNG**
   (same algorithm/state layout as JS so seeded runs match).
2. **Threading dataflow (explicit):** host events (MIDI, automation) enter in `ProcessBlock` with sample
   offsets. UI edits go: WebView → delegate (UI thread) → lock-free pending-param buffer → DSP consumes a
   **double-buffered immutable snapshot at block boundaries** (write to the inactive snapshot, atomic
   index flip — never mutate a snapshot the audio thread may read). No UI→host→DSP round-trips for local
   drawing. No allocation/locks/syscalls in `ProcessBlock`.
3. **Host-anchored tempo sync** (codex-5.5): the browser SYNC mode is deliberately FREE-RUNNING — it derives
   a rate from BPM and never locks phase to song position. In the plugin, when the host transport position is
   valid, synced motions should default to **PPQ-anchored phase** (`phase = frac((ppqAtBlock + beatInc*i) /
   beatsPerCycle + offset)`) so a synced FM/LFO lands on the grid after a locate. Keep a Serum-style
   free/anchor switch: anchoring makes phase jump on tempo/rate edits, which is musically contentious.
   Free-run remains the standalone behavior.
4. **Cross-language golden test** (Phase 1 harness is the prerequisite): same seeds, same event scripts,
   preset matrix; C++ CLI target renders raw blocks; compare vs JS `SynthCore` — RMS AND max-abs
   per-sample < 1e-6, at **44.1k / 48k / 96k** and across different block partitions (absolute counters
   make partitioning exact).

### P2 — Parameters, state, undo, presets
0. **Factor the descriptor as `ParamSpec` + `Shape`** (codex-5.5, 2026-07-23): the browser `_pdesc` table
   stays the source of truth for real-unit min/max/default/discrete/format — but do NOT treat "what host
   automation reads" as one concept, because the three targets disagree. VST3 reads/writes **normalized
   doubles**; CLAP exposes **plain min/max/value doubles** plus `value_to_text`/`text_to_value`; iPlug2 maps
   through `IParam::Shape`. Ship one `Shape` subclass per skew (`lin`, `log`, `zeroLog`) and let thin
   adapters serve each format, rather than bending a single mapping to all three.
1. **Fixed slot model with stable identity**: dedicated LO-CUT and HI-CUT end slots + 12 middle slots.
   A band's slot index IS its automation identity for life — UI display order is separate metadata, and
   insert/delete never renumbers surviving slots (host automation on "Band 3 Freq" must stay attached to
   the same band; the Phase-1 band-id merge protocol maps 1:1 onto slots). Inactive slots: params hold
   defaults, automation writes latch into the slot and take effect on activation (documented behavior).
2. **Automation surface (v1, deliberately reduced)**: synth params + generator + EQ globals + per-slot
   `active/on/type/freq/gain/Q` ≈ 49 + 14×6 ≈ **~135 automatable params**. Full dynamics + slope +
   mute/solo live in the state chunk + UI only for v1 — automating them is a fast-follow once FL's param
   UX is proven (codex: the full 15-field slot set ≈ 273 params is an FL browsing/testing liability).
3. **Preset/state application NEVER floods host gestures**: `begin/SetValueFromUI/end` is reserved for
   real user gestures (FL's Last-Tweaked/linking depends on it). Preset load + undo apply set internal
   state in batch, refresh the UI, `DirtyParametersFromUI`-style bulk host refresh once, mark state dirty.
4. **State chunks**: `PLUG_DOES_STATE_CHUNKS`; content = versioned JSON (preset schema v1 + `schemaVersion`
   + plugin version + full data for ALL slots incl. inactive + loaded-preset identity + deterministic key
   order). Parsed off the audio thread; applied via the P1.2 snapshot path. FL project save/reload
   round-trip incl. a schema-upgrade fixture is the acceptance test.
5. **75-step undo**: port snapshot/pushUndoIfChanged (gesture-bracketed, structural diff) over param+band
   snapshots; WebView gestures bracket begin/end. Define Ctrl+Z ownership: plugin UI keyboard focus keeps
   undo local; FL-level undo interplay documented and tested (P5).
6. **Presets**: factory = `presets.json` (89) compiled into resources; research bank optional/hidden;
   user presets in the OS preset dir; browser UI (dropdown/prev/next/save/dirty-star) drives the same
   batch-apply path as 3.

### P3 — UI: native debug panel first, then the WebView rewrite
1. **P3a — tiny native debug UI** (IGraphics: a dozen knobs + preset load + meter): validates DSP, MIDI,
   state chunks, automation, and threading with zero web complexity. Ships in internal builds only.
2. **P3b — the WebView UI, scoped honestly as a rewrite**: the dc template is not portable markup — it
   depends on the dc-runtime (`sc-if`/`sc-for`, binding/ref conventions, CDN React). Deliverable: a
   vanilla HTML/JS bundle (same DOM structure/styles where practical; canvas draw code — scope/spectro/
   analyzer/EQ handles/menu — ports nearly verbatim; the binding layer is new). Developed and tested in a
   plain browser against the web app side-by-side BEFORE embedding; embedded via `IWebViewControl`
   (WebView2 on Windows) with all assets local, CSP locked, no network.
3. **Bridge reality** (codex-verified): `IWebViewControl` is a native subview with JSON-string messaging
   (`OnMessageFromWebView` / JS eval calls on the UI thread) — **no binary typed-array pipe, and nothing
   touches it from the audio thread**. Define a compact packet format for telemetry (base64 or JSON
   number arrays, measured; decimated) pumped from the UI thread at RAF-ish cadence out of the P4 ring.
   Gestures up: JSON messages → delegate → pending-param buffer (P1.2).
4. DPI scaling, GUI-hidden (no pumping when closed), and keyboard-focus behavior specified and tested.

### P4 — Beam + meter transport (custom ring, not ISender)
1. `ISender` is a small fixed-size control-data helper — wrong tool for beam sample streams. Build a
   **custom SPSC overwrite-oldest ring** (audio writes decimated X/Y batches + meters/GR/eased-band
   telemetry; UI-thread timer drains latest → WebView packet). A stalled/hidden UI never blocks audio;
   beam data is droppable by design (same policy as the Phase-1 web transport).
2. Tune beam decimation/batch size against the web app as the visual reference.

### P5 — Host integration + validation
1. MIDI queue → sample-offset events into `ProcessBlock`; tempo via `GetTempo()`/`ITimeInfo` per block →
   sync fields (SYNC mode derives rates from the JS enum table; free-run drone unaffected).
2. **Reset/bypass/lifecycle spec**: `OnReset` (full core re-init at new SR — coefficients/clamps are
   SR-dependent), `OnActivate`, soft-bypass with tail handling, all-notes-off, offline-render parity
   (FL's rendering), Smart Disable survival (FL suspends plugins), transport reset behavior.
3. **Validation matrix**: FL VST3 (primary) — automation write/read on the v1 surface, project save/
   reload round-trip incl. schema upgrade, preset browser, band insert/delete under automation (slot
   identity holds), EQ→SCOPE toggle, MIDI input, tempo changes mid-note, Smart Disable on/off, fixed +
   variable buffer sizes, DPI scales, GUI open/closed/reopen; VST3 validator + (when CLAP lands)
   `clap-validator` + FL-CLAP (2024.1+) + Bitwig/Reaper; x64 Release CPU profile (headroom at 10 voices ×
   14 bands).

### P6 — C++-only hazards (no browser counterpart)
- **Denormal suppression** (FTZ/DAZ) around the EQ cascade and envelope tails — JS has no equivalent, so this
  class of bug is invisible in the reference implementation and must be added fresh in the port.
- **Sample-rate / block-size changes**: reset and recompute every filter coefficient and easing state in
  `OnReset` (the browser simply gets a fresh AudioContext instead).
- **State-chunk sanitization**: the browser now clamps preset EQ band numerics on load; the plugin's chunk
  reader must do the same — a chunk is untrusted input restored from someone else's project file.

## Risks
- **WebView2 bridge bandwidth** for the beam at scope frame rates — measure early (P3b spike with fake
  data); fallback: coarser decimation or a canvas-side interpolator; worst case the scope runs at reduced
  sample density (audio unaffected).
- **The vanilla UI rewrite is the schedule risk** — P3b is sized as its own mini-project with a browser
  test harness; P3a keeps DSP validation unblocked meanwhile.
- Param-schema evolution after release: v1 surface is deliberately small; adding params later is
  format-compatible (append-only IDs), never reorder.
- CLAP-in-iPlug2 maturity: gated fast-follow, validated independently; VST3 is the ship vehicle.
- Licensing: iPlug2 MIT ✓; no networked assets in the plugin bundle.

## Verification
- P1 cross-language golden renders (automated, per commit; 3 sample rates, varied block partitions).
- VST3 validator (and later clap-validator) green from P0 on.
- State-chunk round-trip fuzz: random slot configs → serialize → load → snapshot equality; plus a
  version-upgrade fixture (old chunk loads with default-fill, like `applyPreset`).
- FL manual matrix (P5) with the web app side-by-side as reference.
