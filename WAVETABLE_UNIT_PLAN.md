# Unit: Wavetable import + oscillator (Serum-compatible)

*(Drafted 2026-07-23. Not yet scheduled — sequencing is an owner call, see § SEQUENCING. Format specs below
are WEB-VERIFIED, not assumed; sources at the end.)*

## Context / why

The instrument has ten **procedural** generators: `shape()` evaluates a parametric formula per sample to get
an (x, y, z) point, and MORPH walks continuously through that family. That is already a wavetable synth in
spirit — MORPH *is* a wavetable position — but the tables are formulas, so you cannot bring in a shape from
outside. Today the app imports exactly one thing: preset JSON (`accept="application/json,.json"`). There is
no WAV handling anywhere (the five "wave" hits in the source are the WAVE *display* mode).

This unit adds the missing half: load a **real wavetable file** and scan it as an 11th generator.

Two payoffs, one of them unique to this instrument:
1. **Compatibility** — Serum-format tables are a de-facto standard shared by Vital, Surge, Bitwig, Ableton
   Wavetable, Pigments and the Eurorack world. Thousands of free and commercial tables become usable.
2. **A stereo table IS an oscilloscope figure.** Output L/R *is* the X/Y beam here, so a stereo WAV whose
   L channel is the X frame and R is the Y frame is a stack of scope drawings you can morph through. No
   Serum-class synth does this, because no other synth's output is a beam. This is the genuinely novel
   capability and it costs almost nothing once the mono path exists.

## Verified format facts (do not re-derive — these were checked against published specs)

**Serum / Xfer WAV (the primary target).** A plain `.wav`; single-cycle frames concatenated end to end.
Metadata rides in a custom RIFF chunk:

```
FormatBlocID  4 bytes : "clm " (0x63 6C 6D 20)
BlocSize      4 bytes : chunk size minus 8      <- keep EVEN; Vital mis-imports odd sizes
ClmData       ASCII   : "<!>AAAA BC000000 D"
```
- `AAAA` — cycle size in samples, typically **2048**. Serum currently *assumes* 2048 always and parses only
  the first 10 bytes (`<!>2048 XX`); the field is reserved for a future 0064…8192 range.
- `B` — interpolation type: `0` none, `1` linear crossfade, `2/3/4` spectral morph modes.
- `C` — Serum factory flag; **must be 0** for user tables.
- `D` — vendor/comment string. Real example:
  `<!>2048 01000000 wavetable (www.xferrecords.com)`

Serum tops out at **256 frames**. Sample rate in the header is *meaningless* (a shape, not a recording);
bit depth is usually 16-bit PCM or 32-bit float. Steve Duda chose WAV deliberately so tables stay open to
other synths and to homebrew.

**Surge XT `.wt` (cheap bonus — same parser skeleton, ~20 extra lines).**
```
"vawt" (4B) | WaveSize u32 (cycle size, power of 2) | WaveCount u16 | Flags u16 | sample data
Flags: 0x80 full 16-bit range (else 15-bit / -6 dBFS) · 0x40 int16 (else float32)
       0x20 looped · 0x10 file is a sample, not a wavetable
```
Example (Bitwig Essentials): `76 61 77 74 00 08 00 00 04 00 0C 00` → 2048/cycle, 4 cycles, int16, full range.

**Vital conventions** (for export compatibility later): 2048 cycle, always 256 cycles on export, 88200 Hz
header, 16-bit, interpolation mode 2.

**No `clm ` chunk?** Infer: try 2048, then power-of-two divisors of the total sample count (256…8192),
preferring one that yields an integer frame count ≤ 256; if ambiguous, ask the user (a small frame-size
picker in the import dialog). Never guess silently.

## Design

### W1 — WAV/WT reader (pure, testable, no DOM)
- `parseWavetable(arrayBuffer)` → `{frames, frameSize, channels, dataL, dataR|null, meta}`. RIFF walker over
  a `DataView`, exactly like the existing `parseMidi` (dc.html — chunk loop + `getUint32`). Handles `fmt `
  (PCM 16/24/32-bit int + 32-bit float), `data`, `clm `, and unknown chunks skipped by length.
- Also accept `vawt`/`.wt` (Surge) by sniffing the first four bytes.
- Normalize to `Float32Array` per channel, peak-normalize to ±1 only if the table exceeds it (do NOT
  auto-gain quiet tables — that destroys relative frame levels a designer intended).
- **Reject/repair rules, stated up front:** frame count > 256 → keep the first 256 and say so; total length
  not divisible by frame size → truncate the partial tail and say so; empty/short file → refuse with a
  readable message. Never load a half-parsed table silently.

### W2 — Anti-aliasing: mipmap pyramid built at import (the real DSP work)
Playing a 2048-sample cycle at a high note asks for harmonics above Nyquist. Untreated this is *both*
audible grit and a visibly ragged beam — on this instrument the aliasing is on screen too, so the visual and
audio requirements point the same way.

Standard, portable solution — build it once at import, not per sample:
1. Real FFT each frame (2048 points).
2. For mip level `k` (k = 0…10), zero every bin above `Nyquist / 2^k`, IFFT back to a band-limited frame of
   length `2048 / 2^k`.
3. At playback pick `k` from the voice's current increment (cycles/sample) so the top retained harmonic
   stays under Nyquist; **crossfade between adjacent levels** across a note glide so mip switching is
   inaudible.
4. Interpolate within a frame (Catmull-Rom or linear — linear is fine at 2048, measure it).

Cost: 256 frames × one 2048-point FFT ≈ tens of milliseconds at import — do it in a worker so the UI never
janks. Memory: base 256 × 2048 × 4 B = 2 MB; the whole pyramid sums to ≈ 2× that ≈ 4 MB per stereo table.
Acceptable, but cap concurrently-loaded tables (start at 1) and document the ceiling.

### W3 — The oscillator: an 11th generator
- New `gen: 'wavetable'`, added to `GENS` with its own description, so it flows through the existing
  generator select, presets, undo and MUTATE machinery untouched.
- `shape(v, finc)` for this generator reads the table instead of evaluating a formula:
  - **Mono table:** `x = table(pos, v.px)`, `y = table(pos, v.px + P.phOff)` — this *reuses the existing
    ST PHASE knob* as the X/Y phase offset, which is exactly how `lissajous` already builds a figure.
  - **Stereo table:** `x = tableL(pos, v.px)`, `y = tableR(pos, v.px)` — the beam is drawn directly.
  - `z` = 0 for v1 (the 3-D rotation stage still applies to the X/Y plane, so ROT X/Y/Z keep working).
- **`pos` (wavetable position) is MORPH.** No new parameter: MORPH already means "walk the shape family,"
  it is already automatable/undoable/preset-carried, and it already has tempo-sync (`morphSync`) — so a
  synced wavetable sweep works on day one. Frame interpolation honours the `clm ` interpolation flag
  (none = hard step, linear = crossfade; spectral modes fall back to linear in v1, documented).
- Everything downstream — SVF, fold/drive, jitter, width, the whole EQ, the beam tap — is untouched.

### W4 — Storage + transport (the boring part that must not be skipped)
- Tables are far too large for preset JSON (2 MB vs a ~4 KB patch) and must not ride the JSON patch to the
  worklet.
- **Storage:** IndexedDB, keyed by a content hash (SHA-256 of the sample data), with the display name and
  `clm ` metadata alongside. Deduplicates re-imports for free.
- **Presets** reference a table by `{hash, name, frames, frameSize}` — never inline the audio. Loading a
  patch whose table is missing must degrade loudly and gracefully: keep the patch, show "table not found —
  re-import <name>", fall back to a built-in default table rather than silence.
- **Worklet transport:** ship the mip pyramid as a **transferable `ArrayBuffer`** in its own message
  (`{t:'wavetable', hash, layout, buffer}`), *not* through `_pushPatch`'s JSON. The patch carries only the
  hash; the processor keeps a small table cache keyed by hash and ignores a patch referencing a table it has
  not been given yet (render silence for that voice rather than reading garbage).
- Ship **2–3 small built-in tables** (basic shapes, a formant sweep, an X/Y demo) so the generator is usable
  before the user imports anything, and so the harnesses have a fixture.

### W5 — UI
- IMPORT gains a table path (`accept=".wav,.wt,audio/wav"`), or a dedicated **LOAD TABLE** button in the
  SIGNAL GENERATOR panel, active only when the wavetable generator is selected.
- A compact frame strip: the current frame drawn as a mini waveform (or X/Y figure for stereo tables) with
  the MORPH playhead — the same information Serum's 3-D view gives, in this instrument's idiom.
- Import dialog surfaces what was parsed: name, frames, frame size, mono/stereo, source (clm/inferred/user),
  plus any truncation that was applied.

## What this does NOT touch
- The Faust export is **EQ-only** by locked decision #12 — a wavetable generator has no effect on it.
- The EQ, metering, analyzer, tempo-sync engine, undo and preset schema all stay as they are (the preset
  schema gains one optional `wavetable:{...}` reference field, default-filled like every other addition).

## SEQUENCING — the honest trade-off

Either order works; the difference is where the cost lands.

- **Before the port (recommended):** built as a `SynthCore` addition, it inherits the whole existing
  apparatus — the golden-render harness makes the JS version the executable spec, the worklet protocol
  already has a transferable path, and the browser is a *far* faster place to iterate on aliasing because
  you can see it on the scope. The port then transliterates it like everything else. Cost: it adds real
  surface to the C++ port (parser, FFT mip builder, table cache).
- **After the port:** Phase 5 ships sooner and smaller. Cost: the feature then has to be built twice (JS
  spec + C++) or written C++-first, giving up the golden-test cross-check that has caught every regression
  so far.

Recommendation: **before**, because the aliasing work is the risky part and the browser is where it is
cheapest to get right — but if shipping a plugin is the nearer goal, deferring is entirely defensible.

## Risks
- **Aliasing is the whole difficulty.** Budget the effort there, not in parsing. Verify by ear *and* by
  spectrum at the top of the keyboard with a bright table (a saw or a formant table, not a sine).
- **Frame-size inference** on tables with no `clm ` chunk is genuinely ambiguous; the user picker is the
  safety valve, not a fallback to be skipped.
- **Memory** with several large tables loaded — enforce the cap, surface it in the UI.
- **Import-time jank** if the FFT runs on the main thread — it must be a worker.
- **Loudness mismatch** between imported tables and the procedural generators; consider a per-table trim
  stored with the reference (do not silently auto-normalize).

## Verification (mirrors the existing `tools/` discipline)
1. `tools/wavetable-check.js` (new): parse a corpus of fixtures — a real Serum table with `clm `, a table
   with no `clm `, a Surge `.wt`, 16-bit / 24-bit / float variants, mono + stereo, a deliberately corrupt
   file, an odd-length file, a >256-frame file. Assert frame count/size, channel handling, the reject/repair
   rules, and hash stability.
2. **Anti-alias assertion, headless:** render a bright table at a high note through `SynthCore`, FFT the
   output, and assert energy above Nyquist-reflection is below a threshold — and that it is *dramatically*
   lower than the same render with mipmapping disabled (so the test proves the mips are doing work, not just
   that the number is small).
3. **Golden renders** extended with a wavetable scenario (built-in fixture table, MORPH sweep, synced sweep)
   — the same bit-identical discipline as every other engine change.
4. **Worklet equivalence** extended to cover the table-transfer message: a table sent as a transferable must
   produce bit-identical audio to the ScriptProcessor path holding the same table.
5. **Browser pass** extended: import a fixture `.wav` through the real file input in headless Chromium and
   Firefox, confirm the generator renders, MORPH sweeps, and a preset round-trips the table reference (plus
   the missing-table degradation path).

## Sources (verified 2026-07-23)
- [Wavetable information and formats (clm + vawt byte layouts)](https://gist.github.com/iicaras/f63dc9fcc3f9a83ccaf2de3fbc9fbb5a)
- [KVR — Wavetable file format?](https://www.kvraudio.com/forum/viewtopic.php?t=517146)
- [Xfer Records forums — file types](https://xferrecords.com/forums/general/file-types)
- [okwt — wavetable creation/manipulation tool (multi-format reference)](https://github.com/drzhnn/okwt)
- [Surge — frame sizes >1024 discussion](https://github.com/surge-synthesizer/surge/issues/461)
