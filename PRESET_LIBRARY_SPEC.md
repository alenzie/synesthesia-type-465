# OsciSynth Type 465 — Factory Preset Library Spec

Research-derived spec for the full factory library (owner decision: full library). Sources: **10 xhigh-opus
agents** (web-researched, mapped to the synth) + **2 codex-5.4 cross-checks** (gpt-5.4 @ high). Every preset
is authored against the planned **12-band dynamic EQ** (per-band: type, Freq, Q, Gain, Range, Threshold,
Ratio, Attack, Release; bidirectional dynamics; per-band frequency-selective detection) + global MIX/OUT.

**Totals:** 66 opus preset concepts across 10 style facets (76 EQ techniques) + ~14 codex presets.
Kinds: `combined-patch` = synth params + its EQ; `eq-only-bank` = a layerable band set applied over any sound.

## The distinct TYPES of EQ (unified taxonomy — the core ask)

Convergent across all 12 researchers. These are the reusable "EQ moves" the library is built from:

| Type | Move | Typical band |
|------|------|--------------|
| Sub hygiene | Kill subsonic headroom-eaters | low-cut 22–35 Hz, 24–48 dB/oct |
| Sub anchor | Chest weight/power | low-shelf/bell +2..+6 @ 45–70 Hz |
| Mud carve | De-box the low-mids | bell −2..−5 @ 250–450 Hz, Q~1 |
| Cinematic smile | "Make it huge" | sub↑ + wide low-mid dip + air↑ (or a tilt) |
| Vowel / formant | "Talking" mids | paired bells at A/E/I/O/U formants |
| Bark / presence | Cut through / read on small speakers | bell +2..+5 @ 1.5–3.2 kHz |
| Dynamic de-harsh | Tame screech only when it spikes | bell/notch @ 2.5–7 kHz, **down**, 2–3:1, range −2..−6, fast atk |
| Dynamic de-ring/de-sizzle | Anti-resonance on a ringing partial | narrow notch @ 5–9 kHz (or the partial), **down**, high-Q |
| Upward air-lift | Bloom brightness at peaks only | high-shelf/bell, **up**, opens at crest |
| Air shelf | "Expensive" top (smooth patches only) | high-shelf +1..+4 @ 8–14 kHz |
| Tilt macro | One-knob dark↔bright mood | tilt band, pivot ~1 kHz, ±1.5..4 dB |
| Dark veil | Eerie/dark | high-cut/LP 8–14 kHz |
| Telephone / band-pass FX | Radio/surveillance bed | LC+HC narrow window or band-pass |
| Impact ducking | Sub yields to booms/kick | dynamic **down** @ 50–70 Hz, fast atk, freq-selective |
| Pultec-style low | Weight without mud | low boost + slightly-higher cut |
| Mid/Side (planned) | Mono-low / wide-high | needs the later M/S path; note L=X, R=Y beam |

---

# Style libraries

---

## Cinematic / Trailer / Film-score

> Cinematic EQ is less about "correcting" and more about sculpting a shape the ear reads as HUGE and TENSE: a wide low-mid scoop (the "smile"/"big" curve) that lets a boosted sub floor and an airy top bloom, a hard split between felt POWER (40-70 Hz) and boomy MUD (100-250 Hz), and heavy use of DYNAMIC EQ to tame the harsh presence rasp of brass/braaams and the metallic ring of resonant partials only when they spike. Risers/downers/whooshes are motion built by sweeping filter windows plus an upward dynamic air-shelf that "breathes" open at the peak; impacts get room by frequency-selective ducking of the sustained sub. The OsciSynth 465 is an ideal target: its geometric FM/oscilloscope generators (lissajous, hyperstar, torus, mobius, lorenz, super/bloom, etc.) are inherently buzzy, metallic and drone-like — exactly the raw material trailer sound designers layer and carve. The wavefolder (FOLD DRIVE) supplies the "fat distortion adds overtones" step, and the 12-band dynamic EQ with bidirectional (up/down) frequency-selective detection, notch/shelf/tilt/band-pass types and a per-band ghost is a FabFilter-Pro-Q-class carving tool. Below: 7 core EQ techniques mapped to concrete band setups, plus 8 ready-to-author preset concepts (6 combined synth+EQ patches spanning sub-drop bed, Inception braaam, dread drone, riser, wide pad, downer/whoosh; and 2 layerable EQ-only banks: a "smile" bus and a dynamic de-harsh/de-ring tamer). All frequency numbers are sourced from trailer/mix engineering guides (see references).

**EQ techniques (this style):**

- **Cinematic Smile / Scooped-Mid "Big" Curve** — The signature "make it enormous" move: boost the sub/low weight and the high air while carving a broad, gentle dip through the low-mids (~300 Hz-1.2 kHz), the primary home of mud and honk. The extremes bloom, the congested middle steps out of the way, and the ear reads the result as bigger, deeper and wider — the classic trailer/metal 'scooped' shape.
  - _On the synth:_ Three static bands: low-shelf +3 to +4 dB @ 60-80 Hz, a wide bell -3 to -5 dB @ 400-600 Hz (Q ~0.6), and a high-shelf +2 to +3 dB @ 10-12 kHz. Or collapse it to ONE tilt band pivoting ~1 kHz. Dynamics OFF. Works on any of the 10 generators; ideal as the eq-only "Smile Bus" bank.
- **Power-vs-Clarity Low-End Divider (sub anchor + dynamic mud clamp)** — Splits 'felt power' (40-70 Hz, chest/rumble) from 'boomy mud' (100-250 Hz). Anchors and boosts the true sub, high-passes the inaudible subsonic that only eats headroom, then DYNAMICALLY clamps the boom region so a dense drone stays powerful without turning to mush — power AND clarity instead of one or the other.
  - _On the synth:_ low-cut @ 25-30 Hz (24 dB/oct) to drop DC/subsonic; low-shelf or bell +4 to +6 dB @ 45-60 Hz for weight; dynamic DOWNWARD bell @ 120-180 Hz (thr -20 dB, ratio 3:1, range -5 dB, med attack/release). Essential because low-baseFreq OsciSynth drones + FOLD DRIVE pile harmonic energy right into 100-250 Hz.
- **Dynamic Braaam / Brass Rasp Tamer (presence de-harsh)** — Brass and braaams are tonally dynamic — the upper-mid bite that sounds right on soft notes turns harsh and screechy when blasted loud. A dynamic downward bell in the 2-5 kHz presence band clamps the harshness ONLY when it spikes, with a slow attack so the initial impact transient still cracks through.
  - _On the synth:_ bell @ 2.5-4 kHz, Q ~2-3, dynamic DOWNWARD, thr -18 dB, ratio 4:1, range -6 dB, attack ~15 ms (lets the blast through), release ~150 ms. Directly leashes the wavefolder/FOLD-DRIVE overtone screech that the FM generators throw.
- **Frequency-Selective Impact Ducking (internal sidechain feel)** — Uses per-band frequency-selective detection to carve momentary room in the sub for a transient impact: the sustained drone's low end ducks just as an impact/kick lands, so the hit punches through cleanly — a surgical alternative to a static low cut or full-band sidechain compression.
  - _On the synth:_ bell @ 50-70 Hz, dynamic DOWNWARD keyed to the band's own level, fast attack ~2 ms, release ~120 ms, range -6 dB. Mirrors kick-vs-sub dynamic EQ (the 40-80 Hz overlap zone). Shines on the sub-drop bed patch where a droning sub must yield to booms.
- **Metallic-Partial De-Ring Notch (dynamic anti-resonance)** — Oscilloscope-FM generators throw sharp resonant partials that 'ring' distractingly out of the mix. A very narrow dynamic notch tamps the single worst partial only when it pops, leaving the rest of the tone fully intact — de-resonance without dulling.
  - _On the synth:_ notch or high-Q bell (Q 12-25) swept onto the offending partial (commonly 1.5-3 kHz), dynamic DOWNWARD, thr -22 dB, ratio 6:1, range -8 dB. Because xHarm/yHarm/zHarm set fixed harmonic ratios, the ringers sit at predictable spots — sweep-to-find, then let dynamics gate it.
- **Dynamic Air-Lift (upward high shelf that opens at the peak)** — Adds 'expensive', open top ONLY when the sound is loud/energetic — an upward dynamic high shelf that blooms air at a riser's crest or a pad's swell while leaving quiet passages dark and un-hyped. This is the 'breathe' effect: brighter at the peak, restrained underneath.
  - _On the synth:_ high-shelf @ 8-12 kHz, dynamic UPWARD, thr -30 dB, ratio 3:1, range +4 to +5 dB, med attack/release. On a riser the top opens exactly at climax; on a pad it adds sparkle without a permanent brightness that would fatigue over a long cue.
- **Tilt / Dark-Bright Tension Morph** — A single tilt band pivots the whole spectrum darker for dread or brighter for a reveal — the fastest 'mood' control for a sustained drone. Tilt down toward the highs = menace/weight; tilt up = hope/lift. Pairs with a high-cut to strip brittle digital fizz on the dark setting.
  - _On the synth:_ TILT band, pivot ~800 Hz-1 kHz, -3 to -4 dB toward the highs for dread (or +3 dB for a reveal), plus a gentle high-cut @ 12-14 kHz to remove brittle FM fizz when dark. Great one-knob dramatic morph on the dread-drone patch.

**Presets (8):**

### Abyss Anchor 465  `[combined-patch]`
- **Style:** Hans Zimmer / Dune-style sub drone + impact bed
- **Goal:** A massive, felt-not-heard sub floor with a defined top so booms punch through — maximum low-end POWER without the boomy mud, the bedrock under a whole cue.
- **Synth patch:** Lorenz (strange-attractor) or Torus generator, baseFreq very low ~28-40 Hz, low drawSpd, xHarm/yHarm on low integer ratios for stable low partials, morph low; slow fmRate ~0.15 Hz with modest fmDepth for a slow tidal swell; FOLD DRIVE moderate for harmonic weight; SMOOTHING high (LPF) to keep the buzz tamed; JITTER low; slow rotY for subtle width.
- **EQ bands:**
  - **low-cut** @ subsonic 24-28 Hz · Q0.7 (24 dB/oct) — _Remove DC/subsonic rumble that only eats headroom_
  - **low-shelf** @ sub 45-60 Hz · +5 dB Q0.7 — _Chest weight / visceral power_
  - **bell** @ low-mid 120-180 Hz · -4 dB (dynamic) Q1.0 · dyn: downward, thr -20 dB, ratio 3:1, range -5 dB, med attack/release — _Clamp boom/mud so the sub stays defined when the drone swells_
  - **bell** @ sub 50-70 Hz · 0 static Q1.2 · dyn: downward, thr -16 dB, ratio 4:1, range -6 dB, fast attack ~2 ms, release ~120 ms — _Frequency-selective duck so impacts/booms punch through the sustained sub_
  - **bell** @ low-mid 300-450 Hz · -3 dB Q0.8 — _Scoop boxiness (start of the smile curve)_
  - **high-shelf** @ air 10-12 kHz · +2 dB Q0.7 — _Faint sheen so the bed isn't totally lifeless_
- **Notes:** MIX ~95-100% wet; use OUT trim to reclaim headroom lost to the sub boost. Mono-safe by nature (single low generator). This is the foundation layer other patches sit on top of.

### Inception BRAAAM 465  `[combined-patch]`
- **Style:** Zimmer-style Inception BRAAAM / epic trailer horn
- **Goal:** A mega-powerful horn-like blast with authority, long sustain and controlled rasp — power and edge without ear-splitting harshness.
- **Synth patch:** Super (bloom / superformula) or Hyperstar, baseFreq low ~55-80 Hz, xHarm/yHarm on rich odd ratios for brassy buzz; FOLD DRIVE high (the wavefolder = the 'fat distortion adds overtones' step); fmDepth moderate with fmRate ~5-7 Hz for a growl; SMOOTHING mid; morph opening the shape across the sustain; slow zoom-in for a swell.
- **EQ bands:**
  - **low-cut** @ subsonic 30-35 Hz · Q0.7 (12-24 dB/oct) — _Clear subsonic mud below the fundamental_
  - **bell** @ bass 80-120 Hz · +3 dB Q0.8 — _Low-brass body and weight_
  - **bell** @ low-mid 250-400 Hz · -4 dB Q1.2 — _Remove honk / box so it reads as brass not mud_
  - **bell** @ presence 2.5-4 kHz · -6 dB (dynamic) Q2.5 · dyn: downward, thr -18 dB, ratio 4:1, range -6 dB, attack ~15 ms, release ~150 ms — _Tame the harsh brass rasp only when the blast screams_
  - **bell** @ upper 6-8 kHz · -4 dB (dynamic) Q2.0 · dyn: downward, thr -20 dB, ratio 3:1, range -4 dB — _Leash sibilant FM fizz on loud partials_
  - **high-shelf** @ air 10 kHz+ · +2.5 dB Q0.7 — _Sizzle/air so the horn cuts over a mix_
- **Notes:** EQ sits POST-FOLD-DRIVE — distortion introduces the overtones, then EQ carves them, per trailer workflow. MIX 100%. Layer over Abyss Anchor for the full 'wall'.

### The Beast — Dread Drone 465  `[combined-patch]`
- **Style:** Johann Johannsson 'The Beast' (Sicario) / Rezz-style droning-mid dissonance
- **Goal:** An unstable, dread-building sustained drone — scooped 'big' but menacing, with a metallic ring auto-tamed and a one-band dark/bright tension morph.
- **Synth patch:** Mobius or Lorenz, baseFreq ~40-50 Hz with a slightly detuned second partial (xHarm vs yHarm nudged off integer = beating dissonance); slow fmRate with deep fmDepth for a seasick wobble; FOLD DRIVE moderate-high; JITTER moderate (grit); slow rotX/rotZ for a morphing stereo image; low drawSpd.
- **EQ bands:**
  - **tilt** @ pivot ~800 Hz-1 kHz · -3.5 dB high side — _Instant dread darken (tilt toward highs); flip positive for a reveal_
  - **low-shelf** @ sub 60-80 Hz · +4 dB Q0.7 — _Sub power / menace weight_
  - **bell** @ low-mid 400-700 Hz · -5 to -6 dB Q0.6 — _The scooped-mid 'big' curve_
  - **notch** @ mid 1.5-3 kHz (swept) · -8 dB (dynamic) Q15-20 · dyn: downward, thr -22 dB, ratio 6:1, range -8 dB — _De-ring the worst metallic FM partial only when it pops_
  - **bell** @ bass 90-140 Hz · +3 dB (dynamic) Q1.0 · dyn: upward, thr -28 dB, ratio 2:1, range +3 dB — _Pull up growl/menace as the drone sustains_
  - **high-cut** @ air 12-14 kHz · Q0.7 (12 dB/oct) — _Keep it dark/organic, strip brittle fizz_
- **Notes:** Dissonance lives on the synth side (harmonic detune + wobble); the EQ keeps 'the beast' controlled and gives the tilt as a live tension knob. Automate the tilt for a build.

### Stratosphere Riser 465  `[combined-patch]`
- **Style:** Trailer riser / pre-drop tension build
- **Goal:** Rising anticipation that stays clear of the low end and blooms open in air at the peak, then hands off to a drop/impact.
- **Synth patch:** Helix or Spiro, baseFreq mid; drawSpd ramping UP; fmDepth increasing; FOLD DRIVE opening; SMOOTHING opening (LPF opens = the main brightening sweep); rotZ accelerating; zoom pushing in toward the crest.
- **EQ bands:**
  - **low-cut** @ bass 100-120 Hz · Q0.7 (24 dB/oct) — _Keep the riser above the bass section so it doesn't clutter the low end_
  - **band-pass** @ low-mid 150 Hz to upper 8 kHz · Q0.7 — _Focus energy into a moving window (SMOOTHING sweeps inside it)_
  - **bell** @ mid 1-3 kHz · +2 dB Q1.0 — _Presence so the riser reads over the bed_
  - **high-shelf** @ air 8-10 kHz · +5 dB (dynamic) Q0.7 · dyn: upward, thr -30 dB, ratio 3:1, range +5 dB, med attack/release — _Air BLOOMS open as the riser peaks (the 'breathe')_
- **Notes:** The synth's SMOOTHING/LPF does the main filter sweep; the dynamic UPWARD air shelf makes the top open exactly at the crest. Automate MIX or drawSpd on the synth side for the build; cut to silence or an impact at the peak.

### Vantablack Pad 465  `[combined-patch]`
- **Style:** BT / Vangelis-style wide cinematic pad — 'epic wide/deep' spectral balance
- **Goal:** A huge, deep, airy, silky pad with the full smile curve — low-end power + scooped mud + high-end air — that evolves slowly under a scene.
- **Synth patch:** Torus or Butterfly, baseFreq ~55-110 Hz; high SMOOTHING for a silky top; gentle fmRate for a slow chorus-like vibrato; low FOLD DRIVE; slow rotX/rotY for an evolving stereo image; morph on a slow LFO feel.
- **EQ bands:**
  - **low-cut** @ subsonic 28-30 Hz · Q0.7 — _Clear DC/subsonic_
  - **low-shelf** @ bass 80-100 Hz · +3.5 dB Q0.7 — _Warmth/weight_
  - **bell** @ low-mid 350-500 Hz · -4 dB Q0.7 — _Scoop mud → 'big'_
  - **bell** @ mid 700 Hz-1.2 kHz · -2 dB Q1.0 — _Remove honk/congestion_
  - **bell** @ presence 2.5-4 kHz · -3 dB (dynamic) Q2.0 · dyn: downward, thr -22 dB, ratio 3:1, range -3 dB — _Keep the pad smooth when notes stack_
  - **high-shelf** @ air 10-12 kHz · +3 dB Q0.7 — _Expensive open top_
- **Notes:** When Mid/Side placement ships, put the low-cut + low-shelf MID-only for a mono, tight bottom, and place the +3 dB air shelf on the SIDES (+0.5-1.5 dB) to wrap the top around the listener — keep side moves subtle and mono-check. For now it's stereo. Gentle boosts only over a long cue.

### Void Downer / Whoosh 465  `[combined-patch]`
- **Style:** Cinematic downer / whoosh transition (the plane-plummet fall into a drop)
- **Goal:** A descending, evaporating fall that darkens as it drops and blooms a sub on landing — a transition that sucks energy downward into an impact.
- **Synth patch:** Spiro or Helix, drawSpd falling; baseFreq gliding down; deep fmDepth with a falling fmRate; SMOOTHING CLOSING (LPF closes = darkening); zoom pulling out; rotZ decelerating; JITTER up for an airy whoosh noise bed.
- **EQ bands:**
  - **low-cut** @ low-mid 150 Hz · Q0.7 — _Keep the whoosh body above the sub during the fall_
  - **high-cut** @ upper 6-8 kHz · Q0.7 (12-24 dB/oct) — _Top darkens as it descends (pairs with SMOOTHING closing)_
  - **high-shelf** @ air 8 kHz+ · -4 dB (dynamic) Q0.7 · dyn: downward, thr -26 dB, ratio 3:1, range -4 dB — _Pull the air down as energy drains_
  - **low-shelf** @ sub 50-70 Hz · +5 dB (dynamic) Q0.7 · dyn: upward, thr -24 dB, ratio 3:1, range +5 dB, fast attack — _Sub BLOOMS in on the landing/impact at the bottom_
- **Notes:** Motion is mostly synth-side (falling drawSpd/baseFreq + closing SMOOTHING); the EQ darkens the top during the fall and lets the sub bloom exactly on the landing so the downer resolves into weight. Place right before a drop or hard cut.

### Cinematic Smile Bus  `[eq-only-bank]`
- **Style:** Trailer master-bus 'smile' / scooped-mid big curve
- **Goal:** A drop-on bank that instantly makes ANY OsciSynth patch sound bigger and more epic — sub weight, scooped mud, airy top — the fastest 'cinematic-ize' move.
- **Synth patch:** n/a (layerable EQ-only)
- **EQ bands:**
  - **low-cut** @ subsonic 25-30 Hz · Q0.7 — _Clear DC/subsonic_
  - **low-shelf** @ sub 60-80 Hz · +3 dB Q0.7 — _Weight/power_
  - **bell** @ low-mid 300-500 Hz · -3.5 dB Q0.6 — _Scoop mud (the smile dip)_
  - **bell** @ mid 800 Hz-1.2 kHz · -2 dB Q1.0 — _De-honk_
  - **high-shelf** @ air 10 kHz+ · +2.5 dB Q0.7 — _Air/sparkle_
- **Notes:** All static — a tilt-like smile you can dial with MIX to taste. Layer over any generator or over a stack. Can be reduced to a single TILT band (pivot ~1 kHz) for one-knob use.

### BRAAAM Tamer / De-Fizz Bank  `[eq-only-bank]`
- **Style:** Dynamic de-harsh + resonance suppression (pro dynamic-EQ practice, SonicScoop / iZotope)
- **Goal:** A drop-on bank for ANY buzzy/metallic OsciSynth-FM patch that auto-tames the harsh presence rasp, the sibilant fizz and the worst ringing partial — transparent when the sound behaves, clamping only on peaks.
- **Synth patch:** n/a (layerable EQ-only; all-dynamic)
- **EQ bands:**
  - **bell** @ presence 2.5-4 kHz · -6 dB (dynamic) Q2.5 · dyn: downward, thr -18 dB, ratio 4:1, range -6 dB, attack ~15 ms, release ~150 ms — _Tame brass/braaam rasp only when loud_
  - **bell** @ upper 6-8 kHz · -5 dB (dynamic) Q2.0 · dyn: downward, thr -20 dB, ratio 3:1, range -5 dB — _Tame FM sibilant fizz_
  - **notch** @ mid 1.5-3 kHz (sweepable) · -8 dB (dynamic) Q18-25 · dyn: downward, thr -22 dB, ratio 6:1, range -8 dB — _Kill the single worst ringing partial only when it rings_
  - **bell** @ low-mid 120-200 Hz · -4 dB (dynamic) Q1.0 · dyn: downward, thr -20 dB, ratio 3:1, range -4 dB — _Control boom buildup on sustained notes_
- **Notes:** Every band is dynamic and frequency-selective — nothing is cut until it spikes, so it de-harshes without dulling. Watch the per-band ghost to see how far each is travelling and back off Range if it pumps. Perfect after a heavy FOLD DRIVE setting.


---

## Ambient / Atmospheric / Textural

> The OsciSynth Type 465 is an X-Y oscilloscope FM/additive engine whose output L=beam-X and R=beam-Y, so every drone is intrinsically harmonically rich, buzzy and metallic — and, crucially, the two channels carry DIFFERENT axis spectra whenever xHarm != yHarm, so resonances frequently live in only one channel. For an ambient facet the dynamic EQ's job is therefore de-harshing more than tone-shaping: catch the metallic partials the wavefolder (FOLD DRIVE) throws off, control low-mid mud from stacked drone fundamentals, band-limit for tape/vinyl warmth, and use the 12-band's bidirectional dynamics + per-band frequency-selective detection to add slow, level-linked movement (a "breathing" air shelf) that mirrors the synth's slow morph/fmRate drift. Research across ambient/drone producers (Stars of the Lid, Tim Hecker, Fennesz, Boards of Canada, Jon Hopkins) and mixing guides converges on a small vocabulary of moves with concrete frequencies: reverb/drone low-cut at 300-400 Hz for mud, an Abbey-Road band window (HP ~600 Hz + LP ~10 kHz) for lush warmth, high-shelf/high-cut de-harsh around a ~2 kHz shelf or 5-8 kHz lo-fi roll-off, dynamic de-ess of 6-8 kHz sibilant sheen, and gentle 10-12 kHz air/tilt for mood. Mid/Side placement is a planned-later capability, so all band configs below are stereo-linked; frequency-selective detection is used as the near-term substitute for the L/R spectral asymmetry that M/S will eventually address.

**EQ techniques (this style):**

- **Dynamic de-harsh / metallic-buzz tamer (downward bell in the 2-6 kHz danger zone)** — Digital/oscilloscope sources get 'prickly' around 4-7 kHz; a downward dynamic bell only clamps that zone when it spikes, preserving the lush body the rest of the time (a compressor+EQ hybrid, far cleaner than a static cut or a multiband).
  - _On the synth:_ Band type = bell at 3.5-5 kHz, Q 2.5-3.5, Gain 0, Range -5 to -6 dB, Dynamic = DOWNWARD, Threshold -20 to -22 dB, Ratio 3:1, Attack 5-8 ms, Release 250-350 ms. This is THE core move because FOLD DRIVE (the wavefolder) and high xHarm/yHarm ratios manufacture exactly this buzzy sheen; the per-band ghost shows how far it travels as morph/fmRate swell the timbre. Because L=X and R=Y can differ, keep Q moderate so a one-channel resonance doesn't force a hard stereo-linked duck.
- **Resonant-partial notching with frequency-selective detection** — Kills the one or two loudest metallic ring-tones of a geometric generator without dulling everything, and only when that partial actually blooms — surgical, artifact-free resonance control.
  - _On the synth:_ Narrow bell/notch, Q 5-6, Range -6 to -8 dB, DOWNWARD, Threshold -20 dB, Ratio 4:1, fast Attack 2-3 ms, Release 150-200 ms, placed on the partial that xHarm/yHarm/zHarm parks a harmonic at (sweep 2-5 kHz with a high-Q boost to find it, then flip to a dynamic cut). Frequency-selective detection means the band listens to its OWN band, so it ignores the drone fundamental and reacts only to that partial — the near-term stand-in for Mid/Side while that is still planned.
- **Low-mid mud control (static dip + dynamic de-mud at 200-400 Hz)** — Stacked/detuned drone tones pile energy in the low mids and turn washy; clearing 200-400 Hz lets air and detail through — the classic 'cut the mud instead of boosting the highs' ambient principle.
  - _On the synth:_ Static bell at 250-350 Hz, -3 dB, Q 1.0-1.2 for a fixed clean-up; OR a DOWNWARD dynamic bell at ~250 Hz, Range -5 dB, Threshold -18 dB, Ratio 3:1, Attack 15 ms, Release 400 ms so it only ducks when chord/drone swells build mud. Pairs with a low-shelf for body so the drone stays warm, not thin. Guide value: low-cut reverb/pad mud at 300-400 Hz (6-12 dB/oct).
- **Lo-fi band-limiting (low-cut + high-cut window for tape/vinyl warmth)** — Rolls off the extremes to a narrow, nostalgic window — the single biggest lever for tape/vinyl character; combined with the synth's SMOOTHING and JITTER it reads as an old, worn recording.
  - _On the synth:_ Use the LOW-END slot low-cut at 80-100 Hz (vinyl-rumble removal) + the HIGH-END slot high-cut at 5-8 kHz (12 dB/oct) for lo-fi; or the 'Abbey Road' lush window HP ~600 Hz + LP ~10 kHz for a distant, reverbey pad. Add a low-shelf/bell warmth bump +2 to +2.5 dB at 200 Hz and a small character notch (~1.8 kHz, -3 dB, Q 4) for vintage-speaker color. Stack on top of FOLD DRIVE for harmonic grit, then band-limit it away.
- **Air lift + shimmer (high-shelf 10-12 kHz), static or upward-dynamic** — Reintroduces the sheen the synth's SMOOTHING lowpass (and any high-cut) removes, opening the top so a dark drone still feels present — 5-10 kHz = sparkle, 10-20 kHz = whispery sheen.
  - _On the synth:_ High-shelf at 10-12 kHz, +2 to +3 dB for a fixed lift; OR an UPWARD dynamic high-shelf at 10 kHz, Range +4 dB, Threshold -30 dB, Ratio 2:1, slow Attack 60 ms, Release 800 ms so air blooms as the drone falls quiet — a 'breathing' motion that syncs to the slow morph/amplitude drift. Guide anchors: 8 kHz +2 dB re-airs a choked pad, 10 kHz +6 dB is an aggressive shimmer.
- **Spectral tilt for global mood (tilt band, dark/warm vs bright/open)** — Tips the whole spectrum brighter or darker in one gesture while preserving internal tonal relationships — ideal for setting a drone's overall temperature or matching track-to-track without 'breaking' the timbre.
  - _On the synth:_ Single TILT-type band, pivot ~1 kHz: -1.5 to -3 dB toward the lows = warm/dark (menacing sub-drones), +1 to +2 dB toward the highs = open/airy (shimmer pads). Cheaper and more natural than juggling a shelf pair; great as the top band of an EQ-only bank so one knob re-moods any generator.
- **Dynamic de-ess of metallic sibilance (6-8 kHz)** — Oscilloscope tracing + wavefolder can spit a sibilant 'sss/tsss' sheen at 6-8 kHz (up to 10 kHz); a dynamic band tames it with surgical precision while keeping the pad's brightness — like a de-esser but for a synth.
  - _On the synth:_ Bell at 6.5-7 kHz, Q 3, DOWNWARD, Range -6 dB, Threshold -24 dB, Ratio 3:1, fast Attack 1.5 ms, Release 120 ms. Sits above the 4-5 kHz de-harsh band; the two together turn a harsh hyperstar/spiro into an ambient-safe wash without a blanket high-cut that would kill all air.
- **Level-linked movement / auto-EQ (dynamic bands as slow modulation)** — Turns the EQ itself into a movement source: bands that open/close with the drone's amplitude add slow evolution so a static pad never sits still — the ambient goal of 'subtle change over 16-64 bars.'
  - _On the synth:_ Combine an UPWARD dynamic presence bell (~1.2 kHz, Range +2 dB, slow Release 800 ms) with the breathing air shelf above, both keyed to the same slow amplitude drift the synth's fmRate/morph produce. Contrasts with faster fmDepth vibrato so you get one slow envelope-following EQ motion layered over the periodic FM wobble — auto-filter feel without touching the synth's own SMOOTHING.

**Presets (7):**

### Cathedral Drift  `[combined-patch]`
- **Style:** Stars of the Lid / Brian Eno slow evolving drone
- **Goal:** A vast, warm, cathedral-sized pad that morphs almost imperceptibly — the metallic edge of the oscilloscope tone dissolved into a soft, airy wash.
- **Synth patch:** Generator = torus (or helix); baseFreq ~55-110 Hz drone; drawSpd slow; xHarm 2 / yHarm 3 for gentle beating; morph very slow; fmRate ~0.1 Hz with small fmDepth for glacial drift; FOLD DRIVE low; SMOOTHING moderate-high to soften; JITTER tiny; slow rotY for stereo motion.
- **EQ bands:**
  - **low-cut** @ subsonic 30Hz · 0 Q0.7 (12 dB/oct) — _Remove infrasonic beam-DC/rumble below the drone fundamental_
  - **low-shelf** @ low 90Hz · +2 Q0.6 (wide) — _Gentle body/warmth under the drone_
  - **bell** @ low-mid 280Hz · -3 Q1.0 — _Clear low-mid mud so detail and air come through_
  - **bell** @ presence 3.5kHz · 0 Q2.5 · dyn: downward, thr -22dB, ratio 3:1, range -5dB, attack 8ms, release 300ms — _Tame metallic wavefolder swell only when it spikes_
  - **tilt** @ pivot ~1kHz · -1.5 toward lows — _Global warm/dark mood tilt_
  - **high-shelf** @ air 12kHz · +2 Q0.6 — _Reintroduce sheen lost to SMOOTHING_
  - **high-cut** @ top 16kHz · 0 Q0.7 (12 dB/oct) — _Soft top roll-off for an analog ceiling_
- **Notes:** Keep the 3.5kHz de-harsh Q moderate: because L=X and R=Y differ, a high-Q stereo-linked duck would pump asymmetrically. Mid/Side would be ideal here once that planned capability ships.

### Tape Ghost  `[combined-patch]`
- **Style:** Boards of Canada / lo-fi tape-drone
- **Goal:** A nostalgic, band-limited, slightly-wobbling pad that sounds like it was bounced to a worn cassette — rolled-off highs, warm mids, faint noise.
- **Synth patch:** Generator = lissajous; baseFreq ~110 Hz; FOLD DRIVE moderate for warm harmonics; SMOOTHING high; fmRate slow with a touch of fmDepth to emulate tape wow/flutter pitch wobble; JITTER small for hiss/instability.
- **EQ bands:**
  - **low-cut** @ low 90Hz · 0 Q0.7 (12 dB/oct) — _Vinyl/tape rumble removal_
  - **low-shelf** @ low 200Hz · +2.5 Q0.6 — _Tape warmth and body_
  - **bell** @ low-mid 500Hz · -2 Q1.2 — _Reduce boxiness_
  - **notch** @ mid 1.8kHz · -3 Q4 — _Vintage mid-scoop / old-speaker color_
  - **bell** @ presence 4kHz · 0 Q3 · dyn: downward, thr -20dB, ratio 3:1, range -5dB, attack 5ms, release 200ms — _Tame FOLD-DRIVE fizz before it hits the high-cut_
  - **high-cut** @ top 6.5kHz · 0 Q0.7 (12 dB/oct) — _Classic lo-fi rolled-off highs_
- **Notes:** For a more distant 'lush' variant swap the 90Hz/6.5kHz pair for the Abbey-Road window (HP ~600 Hz + LP ~10 kHz).

### Metallic Bloom Tamer  `[eq-only-bank]`
- **Style:** Tim Hecker / Fennesz harsh-drone de-harsh
- **Goal:** Drop onto ANY buzzy generator (hyperstar, spiro, cube) to make it ambient-safe — the loud metallic partials and sibilant sheen clamped only when they bloom, lush body untouched.
- **EQ bands:**
  - **notch** @ low-presence 2.6kHz · 0 Q6 · dyn: downward, thr -20dB, ratio 4:1, range -8dB, attack 3ms, release 200ms — _Catch the loudest resonant partial as it swells_
  - **bell** @ presence 4.2kHz · 0 Q5 · dyn: downward, thr -22dB, ratio 4:1, range -6dB, attack 3ms, release 180ms — _Second resonance / harshness spike control_
  - **bell** @ upper 7kHz · 0 Q3 · dyn: downward, thr -24dB, ratio 3:1, range -6dB, attack 1.5ms, release 120ms — _Dynamic de-ess of metallic sibilant sheen_
  - **bell** @ presence 3.3kHz · -2 Q2 — _Fixed general presence tame under the dynamics_
  - **high-shelf** @ top 9kHz · -2 Q0.6 — _Soften overall top without killing all air_
- **Notes:** Frequency-selective detection is essential here so each band listens to its own zone and ignores the drone fundamental. Sweep with a high-Q boost first to park each notch on the actual xHarm/yHarm partial, then flip to the dynamic cut.

### Breathing Air  `[eq-only-bank]`
- **Style:** Brian Eno / evolving generative ambient
- **Goal:** Adds slow, level-linked movement and air to any static pad — the top end blooms as the drone falls quiet and settles back as it swells, so nothing ever sits perfectly still.
- **EQ bands:**
  - **high-shelf** @ air 10kHz · 0 (up to +4) Q0.6 · dyn: upward, thr -30dB, ratio 2:1, range +4dB, attack 60ms, release 800ms — _Air 'breathes' in on quiet passages for slow motion_
  - **bell** @ mid 1.2kHz · 0 (up to +2) Q1.5 · dyn: upward, thr -28dB, ratio 2:1, range +2dB, attack 40ms, release 800ms — _Presence lift on quiet passages, level-linked_
  - **tilt** @ pivot ~800Hz · +1 toward highs — _Gentle open/bright mood_
  - **low-shelf** @ low 120Hz · -1 Q0.6 — _Keep the low end tidy under the movement_
- **Notes:** Key the two upward bands to the same amplitude drift the synth's slow fmRate/morph produce — you get one slow envelope-following EQ motion layered over the faster periodic FM wobble, an auto-filter feel with no synth-side automation.

### Sub Monolith  `[combined-patch]`
- **Style:** Lustmord / sunn O))) dark-ambient drone
- **Goal:** A deep, menacing, near-black sub-drone — heavy low weight, low-mid mud kept in check dynamically, top end almost entirely removed for dread.
- **Synth patch:** Generator = lorenz (strange attractor) or cube; baseFreq very low ~40-55 Hz; drawSpd slow; minimal harmonics; heavy SMOOTHING; tiny FOLD DRIVE; slow rotX/Z for subterranean motion.
- **EQ bands:**
  - **low-cut** @ infrasonic 24Hz · 0 Q0.7 (12 dB/oct) — _Clean infrasonic energy below the fundamental_
  - **low-shelf** @ sub 55Hz · +3 Q0.6 — _Sub weight / monolithic body_
  - **bell** @ low-mid 250Hz · 0 Q1.2 · dyn: downward, thr -18dB, ratio 3:1, range -5dB, attack 15ms, release 400ms — _Duck mud only when the drone swells_
  - **bell** @ low-mid 500Hz · -3 Q1.4 — _Remove honk / boxiness_
  - **tilt** @ pivot ~1kHz · -3 toward lows — _Deep dark spectral tilt_
  - **high-cut** @ top 5kHz · 0 Q1.0 (24 dB/oct) — _Heavy top roll-off for darkness/menace_
- **Notes:** Watch gain-staging: +3 dB sub-shelf on a 40 Hz beam fundamental can clip; trim OUT and set MIX ~90% wet so a little dry keeps transient definition.

### Glass Shimmer Pad  `[combined-patch]`
- **Style:** Jon Hopkins / ambient-techno shimmer pad
- **Goal:** A bright, glassy, moving pad that sparkles up top while staying clear of the sub — leaves room for a kick, with harshness dynamically tamed so the shimmer never fatigues.
- **Synth patch:** Generator = super (bloom/superformula) or spiro; baseFreq ~110-220 Hz; higher xHarm/yHarm ratios for shimmer partials; morph moving slowly; moderate SMOOTHING; slow fmRate for gloss.
- **EQ bands:**
  - **low-cut** @ low 120Hz · 0 Q0.8 (18 dB/oct) — _Clear the sub so kick/bass have room (HP pads 80-150 Hz)_
  - **bell** @ low-mid 350Hz · -3 Q1.0 — _Mud cleanup_
  - **notch** @ presence 2.4kHz · -3 Q6 — _Notch a fixed metallic resonance of the bright partials_
  - **bell** @ presence 5kHz · 0 Q3 · dyn: downward, thr -20dB, ratio 3:1, range -5dB, attack 5ms, release 250ms — _Dynamic de-harsh so the shimmer stays smooth_
  - **high-shelf** @ air 11kHz · +3 Q0.6 — _Glassy shimmer / sparkle_
- **Notes:** If the sparkle is inconsistent between L and R (xHarm != yHarm puts more high energy on one axis), keep the 5kHz de-harsh at moderate Q; a stereo-linked high-Q clamp would tilt the image. A future Mid/Side split would let you air-up the sides only.

### Hypnotic Wasp Mid  `[combined-patch]`
- **Style:** Rezz-style droning atmospheric mid
- **Goal:** A hypnotic, buzzing droning mid that sits in the middle of a track and never fatigues — the wasp-buzz character kept but its harsh peaks dynamically leashed so it can drone for bars.
- **Synth patch:** Generator = mobius or butterfly; baseFreq ~150-220 Hz; FOLD DRIVE moderate-high for the buzzy wasp timbre; fmRate ~5-6 Hz with small fmDepth for the droning wobble; SMOOTHING low-moderate; slow rotZ.
- **EQ bands:**
  - **low-cut** @ low 100Hz · 0 Q0.7 (12 dB/oct) — _Clear the sub so the mid drone stays focused_
  - **bell** @ low-mid 600Hz · +2 Q1.0 — _Midrange body/focus for the hypnotic core_
  - **bell** @ presence 3.5kHz · 0 Q3 · dyn: downward, thr -20dB, ratio 4:1, range -6dB, attack 4ms, release 220ms — _Dynamic de-harsh of the buzz peaks so it can drone without fatigue_
  - **notch** @ presence 5kHz · -3 Q5 — _Control the nasal wavefolder edge_
  - **high-cut** @ top 9kHz · 0 Q0.7 (12 dB/oct) — _Keep it dark and hypnotic_
- **Notes:** For a rhythmic 'talking' variant, key the 3.5kHz dynamic band with a faster release (~80 ms) so the buzz pulses in time with the fmRate wobble.


---

## EDM Sound-Design Fundamentals

> The Type 465 is an X-Y oscilloscope synth: L=beam-X, R=beam-Y, so the raw sound is harmonically rich, buzzy, metallic and drone-like, with sharp inharmonic partials from the per-axis harmonic ratios (xHarm/yHarm/zHarm) and the FOLD DRIVE wavefolder. That makes it a heavy consumer of corrective EQ, and its planned FabFilter-style 12-band dynamic EQ (bell/shelf/cut/notch/band-pass/tilt, bidirectional up/down dynamics, per-band frequency-selective detection, planned M/S) is a near-perfect match. The universal toolbox is eight moves: (1) low-cut just under the drone fundamental (baseFreq) to reclaim headroom; (2) sweep-and-destroy resonance notches for the ringing metallic partials — dynamic when they move with fmRate/morph; (3) mid-range carving of 250-500 Hz mud and 700 Hz-1 kHz honk for clarity; (4) formant/vowel resonant boosts to make mids and growls "talk"; (5) dynamic EQ on the bass for a kick pocket / self-leveling sub (the transparent alternative to sidechain compression); (6) dynamic de-essing at 4-10 kHz to tame the wavefolder/JITTER sizzle without dulling everything; (7) a tilt band for one-move brightness/warmth; and (8) mono-below-X, which matters MORE here than on a normal synth because L=X and R=Y are independent axes and the low end is intrinsically decorrelated. Two preset kinds ship: combined synth+EQ patches, and layerable EQ-only banks that drop a band-set onto any sound. Key synth-side interplay: SMOOTHING is a global synth LPF (gross tone) so the EQ's job is surgical; baseFreq sets where the low-cut sits; fmRate/fmDepth move the fundamental, favoring dynamic bands over static notches; JITTER and FOLD DRIVE feed the 4-8 kHz clank/fizz zone.

**EQ techniques (this style):**

- **High-pass cleanup (low-cut under the drone fundamental)** — Removes subsonic rumble, DC-like beam drift, and inaudible energy below the note that eats headroom and muddies the sub, so the mix has a defined bottom.
  - _On the synth:_ Use the low-end slot (or band 1) as a Low-cut, selectable slope 12-24 dB/oct, corner ~1 octave below baseFreq (baseFreq 55 Hz -> cut ~27-30 Hz). Because large zoom/persp/rotX-Y-Z excursions push slow DC-like wander into L/R, prefer a steeper 24 dB/oct at 24-30 Hz over the usual 20 Hz. On leads/plucks/chords/FX move the corner up to 100-200 Hz. Static, no dynamics.
- **Resonance taming (sweep-and-destroy notch, dynamic if it moves)** — Locates and kills the one or two screaming ringing partials — the inharmonic spikes the wavefolder and integer axis-ratios create — without gutting the tone.
  - _On the synth:_ Temporarily set a Bell to +12 dB, Q 20-30, and sweep 800 Hz-7 kHz until the nasty peak jumps out; then flip to Notch or high-Q Bell at -6 to -10 dB (Q 15-30). Because xHarm/yHarm/zHarm produce sharp inharmonic peaks, expect 1-3 offenders. If the peak drifts with fmRate vibrato or morph, make the band Dynamic (downward, thr ~-24 dB, ratio 4:1, range -8 dB, fast attack) so its frequency-selective detection only clamps when that partial actually spikes.
- **Mid-range carving (250-500 Hz mud + 700 Hz-1 kHz honk)** — Opens the mix and de-muds it by scooping the low-mid buildup and the boxy honk, carving pocket for kick/bass and any vocal.
  - _On the synth:_ Wide Bell (Q 0.7-1.0), -2 to -4 dB at ~300 Hz for mud; a second narrower Bell (Q 2-3), -3 dB at 700-900 Hz for the oscilloscope's low-order-harmonic honk. Biggest single clarity win on drone/pad patches from torus/helix/cube. Make the 300 Hz cut Dynamic-downward (thr -20 dB, ratio 2:1, range -4) if the mud only piles up when FOLD DRIVE is pushed.
- **Formant / vowel EQ (make a mid or growl talk)** — Imposes vocal vowel resonances so a mid-range or growl sounds like it is speaking — the vocal-aggression trick behind Rezz/Zomboy-style basses.
  - _On the synth:_ Stack 2-3 resonant Bell boosts (or one Band-pass) at formant frequencies, Q 6-10, +4 to +6 dB. Vowel pairs (F1/F2): ah 730/1090 Hz, ee 270/2300 Hz, oh 570/840 Hz, oo 300/870 Hz. Pin two bells to a vowel pair, then ride the fmRate LFO or morph so the fundamental slides under the fixed formants for a moving mouth. Best on butterfly/spiro/super generators with FOLD DRIVE up.
- **Dynamic EQ on bass (kick pocket / self-leveling sub)** — Ducks the bass sub band so the kick fundamental punches through (transparent alternative to sidechain compression) and keeps the drone's sub level even.
  - _On the synth:_ Bell at 50-70 Hz (kick fundamental / tuned to baseFreq), Dynamic downward, ratio 3-4:1, threshold -18 to -24 dB, range -3 to -6 dB, attack 2-5 ms, release 60-120 ms. External kick sidechain is not wired yet, so use the band's own frequency-selective detection to self-duck when the sub over-blooms (morph/fold can pump the fundamental). A gentle version (ratio 2:1, range -3) just glues the sub.
- **Harsh de-essing (metallic sizzle / fizz control)** — Tames the harsh 4-10 kHz stab — here the odd-harmonic buzz of the wavefolder plus JITTER hiss — only when it crosses threshold, without dulling the whole top end.
  - _On the synth:_ Dynamic Bell, sweep 4-10 kHz to find where it stabs hardest (often 6-8 kHz on folded oscilloscope tones), Q 4-6, downward, threshold -22 to -26 dB, ratio 4-6:1, range -5 to -8 dB, attack 0.5-3 ms, release 40-80 ms. Add a Dynamic high-shelf at 10-12 kHz for JITTER hiss. More surgical than raising SMOOTHING (the synth's global LPF), which kills sparkle everywhere.
- **Tilt for brightness / warmth** — One control tips the whole spectrum brighter or darker without breaking the timbre — fast tone-matching for vibe and for fitting a patch into a brighter or darker mix.
  - _On the synth:_ Set a Tilt band, pivot ~650 Hz-1 kHz. Tilt up +2 to +4 dB to make a hyperstar/super lead glassy and cut through; tilt down -2 to -3 dB to warm a torus/helix pad or darken an over-buzzy fold-driven patch. More natural than a shelf pair; use it as the last 'vibe' band.
- **Mono-below-X (tame the decorrelated low end)** — Collapses sub/bass toward mono so it stays phase-coherent on multi-sub club rigs and survives vinyl/MP3 encoding.
  - _On the synth:_ Matters MORE on the 465 than a normal synth: L=X and R=Y are independent geometric axes, so the low end is intrinsically decorrelated and phase-cancels in mono. Mid/Side is a planned capability — when it lands, put a Low-cut on the SIDE channel at 100-150 Hz (elliptical filter). Until then, keep low content mono by parking rotX/Y/Z, persp and zoom near-still on sub/bass patches so X and Y track together below ~120 Hz, and steep-low-cut under the fundamental. Always check in mono.

**Presets (6):**

### Foundation Cleanup 465  `[eq-only-bank]`
- **Style:** Universal EDM mix hygiene (edmprod / Sage Audio EQ methodology)
- **Goal:** The default starting-grid that drops onto ANY OsciSynth patch: reclaims headroom, de-muds, and leashes the metallic top without imposing a tone.
- **EQ bands:**
  - **low-cut** @ sub 30Hz · Q24 dB/oct slope — _Remove subsonic rumble and beam-drift DC below the fundamental_
  - **bell** @ low-mid 300Hz · -3 Q0.8 — _Wide mud/low-mid honk scoop for clarity_
  - **bell** @ presence 3.5kHz · 0 static / -5 range Q4 · dyn: downward, thr -24dB, ratio 3:1, range -5dB, fast attack (2ms), rel 60ms — _Tame upper-mid harshness only when it stabs_
  - **bell** @ brilliance 6.5kHz · 0 static / -6 range Q5 · dyn: downward, thr -22dB, ratio 4:1, range -6dB, attack 1ms, rel 50ms — _De-ess the wavefolder metallic sizzle_
  - **tilt** @ pivot ~800Hz · 0 (adjust +/-2) — _Last-stage brightness/warmth trim to taste_
- **Notes:** Leave the tilt and both dynamic bands near-neutral so the bank is genuinely universal; nudge per patch. This is the layer the artist-specific facets extend.

### Sub Anchor 465  `[combined-patch]`
- **Style:** Festival house / techno mono sub (mixanalog mono-low-end)
- **Goal:** A tight, mono, phase-coherent sub/bass foundation from the oscilloscope — weight without wander or fizz.
- **Synth patch:** lissajous generator, baseFreq ~45 Hz, xHarm 1 / yHarm 1 (near-circle for a pure-ish tone), morph low, SMOOTHING high (kill buzz), FOLD DRIVE minimal, JITTER 0, rotX/Y/Z + persp + zoom near-still so X and Y stay correlated below 120 Hz.
- **EQ bands:**
  - **low-cut** @ sub 24Hz · Q24 dB/oct — _Kill infrasonic energy under the fundamental_
  - **bell** @ sub 50Hz · 0 / -3 range Q1.5 · dyn: downward, thr -14dB, ratio 2:1, range -3dB, attack 4ms, rel 100ms — _Self-leveling sub — stop the fundamental over-blooming when morph/fold push it_
  - **low-cut** @ low 120Hz (SIDE channel) · Q12 dB/oct · dyn: off (M/S band, planned) — _Mono-below-120 via M/S when it ships; today keep motion knobs still instead_
  - **bell** @ low-mid 250Hz · -3 Q1.0 — _Trim mud so the sub reads as pure weight_
  - **high-cut** @ presence 8kHz · Q12 dB/oct — _Remove oscilloscope fizz a sub does not need (subtractive)_
- **Notes:** Pair with the kick by tuning the 50 Hz dynamic band to the kick's fundamental once external sidechain lands; until then it self-ducks. Verify in mono.

### Talking Growl 465  `[combined-patch]`
- **Style:** Neuro / dubstep vocal growl (Rezz / Zomboy / Skrillex-adjacent; edm.com beefy-growls)
- **Goal:** An aggressive mid-range bass that 'talks' — vowel-morphing, metallic, wobbling with the FM LFO.
- **Synth patch:** butterfly or spiro generator, baseFreq ~90 Hz, xHarm 2 / yHarm 3 (inharmonic metallic), morph mid-animated, FOLD DRIVE high (aggressive harmonics), fmRate ~4-8 Hz + fmDepth high (the growl wobble), SMOOTHING moderate.
- **EQ bands:**
  - **low-cut** @ bass 60Hz · Q18 dB/oct — _Clear the sub so the growl sits above the Sub Anchor_
  - **bell** @ low-mid 280Hz · -4 Q1.2 · dyn: downward, thr -18dB, ratio 2:1, range -4dB — _Control low-mid mud BEFORE the distortion character (dynamic when fold peaks)_
  - **bell** @ mid 750Hz · +5 Q6 — _Formant F1 'ah' — vowel resonance / knock_
  - **bell** @ mid 1.1kHz · +4 Q8 — _Formant F2 (paired for vowel) + note-defining knock_
  - **bell** @ upper-mid 1.8kHz · 0 / -6 range Q5 · dyn: downward, thr -20dB, ratio 4:1, range -6dB, attack 1ms, rel 60ms — _Tame the metallic clank when it gets thin/harsh_
  - **bell** @ brilliance 7kHz · 0 / -6 range Q5 · dyn: downward, thr -24dB, ratio 5:1, range -6dB — _De-fizz the fold/jitter sizzle_
- **Notes:** Ride the two formant bells (or morph/fmRate) between vowel pairs for a moving mouth. EQ the clank AFTER distortion, not before — comb/fold artifacts get ugly fast.

### Glass Lead Presence 465  `[combined-patch]`
- **Style:** Melodic / future-bass bright lead (production-expert tilt approach)
- **Goal:** A shimmering, cutting lead that stays present and glassy without turning brittle or harsh.
- **Synth patch:** hyperstar or super(bloom) generator, note-pitched baseFreq, high xHarm/yHarm for shimmer, morph animated, moderate FOLD DRIVE, low SMOOTHING (keep it bright), some rotX/Y for width.
- **EQ bands:**
  - **low-cut** @ low 120Hz · Q18 dB/oct — _Leads carry no lows — clear room for bass_
  - **notch** @ upper-mid 2.2kHz · -7 Q22 · dyn: off (make dynamic if it moves with morph) — _Sweep-and-destroy the one ringing inharmonic partial_
  - **bell** @ presence 4kHz · 0 / -5 range Q4 · dyn: downward, thr -20dB, ratio 3:1, range -5dB — _De-harsh the presence stab only on loud notes_
  - **tilt** @ pivot 800Hz · +3 toward highs — _Tilt bright for cut-through_
  - **high-shelf** @ air 14kHz · +3 Q0.7 — _Add sparkle/air_
- **Notes:** If two partials ring, duplicate the notch. The dynamic presence band lets you tilt bright without the loud notes becoming ice-picks.

### Pluck Pocket 465  `[eq-only-bank]`
- **Style:** House / melodic-EDM pluck placement (hyperbits/Sage carving)
- **Goal:** Carves any 465 pluck to sit in its own slot — above the bass, below the vocal — with a crisp transient.
- **EQ bands:**
  - **low-cut** @ low 150Hz · Q18 dB/oct — _Steep clear of the bass region_
  - **bell** @ low-mid 400Hz · -3 Q1.2 — _Scoop mud so it tucks into the pocket_
  - **bell** @ presence 4kHz · +4 range Q3 · dyn: upward, thr -30dB, ratio 2:1, range +4dB, attack 0.5ms, rel 40ms — _UPWARD dynamic — add attack/click only on the transient_
  - **bell** @ brilliance 7kHz · 0 / -5 range Q5 · dyn: downward, thr -24dB, ratio 4:1, range -5dB — _De-ess the metallic tail_
  - **high-shelf** @ air 10kHz · +2 Q0.7 — _Sparkle_
- **Notes:** Demonstrates the bidirectional dynamics: an UPWARD band accentuates the pick transient while a DOWNWARD band tames the ring — same EQ, both directions.

### Riser & Noise-FX Shaper 465  `[eq-only-bank]`
- **Style:** Build-up white-noise / attractor sweep FX (unison risers guide)
- **Goal:** Shapes a riser or noise-FX (lorenz + high JITTER) so it 'opens up' as it builds and never ear-fatigues at the peak.
- **EQ bands:**
  - **low-cut** @ low 200Hz · Q12 dB/oct — _Rises need no lows — prevents build-up mud (automate the corner upward for extra lift)_
  - **tilt** @ pivot 1kHz · +3 toward highs — _Tilt bright so the FX brightens through the build (pairs with a synth filter sweep)_
  - **notch** @ mid 2-4kHz · -6 Q18 · dyn: downward, thr -20dB, ratio 4:1, range -8dB (only clamps at the peak) — _Kill the resonant peak of the sweep as it passes through_
  - **high-shelf** @ air 8kHz · +4 Q0.7 — _Air/excitement toward the top of the build_
  - **bell** @ presence 5kHz · 0 / -6 range Q4 · dyn: downward, thr -22dB, ratio 5:1, range -6dB — _Keep the loudest part of the sweep from stabbing the ears_
- **Notes:** The dynamic notch is the trick: because the sweep's resonant peak moves, frequency-selective detection ducks it only as it crosses that band, so the riser stays smooth without a static hole.


---

## Skrillex

> Skrillex's signature is aggressive FM/vocoded dubstep growls with a "talking" formant-morph quality, metallic/robotic mid-range, hard-scooped low-mids and a spiky 1–3 kHz bite, all built by layering distorted mids over a clean mono sub. The technique that stamps the style is formant EQ: two moving bell boosts sitting on a vowel's F1 and F2 with a deep scoop notched between them, then morphed to say "oo→ah→ee" (Skrillex famously abuses FM8's TalkWah plus vowel-filter EQ shifting). On the OsciSynth Type 465 the metallic/robotic timbre comes from high per-axis harmonic ratios (xHarm/yHarm/zHarm), the FOLD DRIVE wavefolder, and the lorenz strange-attractor generator, with the growl motion driven by fmRate/fmDepth and morph. The 12-band dynamic EQ then does the actual Skrillex "voice": formant bell-pairs for the talking vowel, a wide low-mid scoop plus a narrow presence bite, downward dynamic bells to tame the ice-pick harshness the wavefolder throws off, a dynamic notch on the fixed metallic ring, and a dynamic low-shelf to duck the sub under the mid growl. Both combined synth+EQ patches and drop-on EQ-only banks are given so the vowel/scoop/sub-split moves can be layered onto any generator.

**EQ techniques (this style):**

- **Formant vowel-pair bells (the 'talking' move)** — Recreates a spoken vowel by boosting the two lowest vocal formants (F1 and F2) as narrow peaks with a deep scoop notched between them; sliding the F2 peak up/down morphs the vowel (oo→oh→ah→eh→ee), which is exactly the 'talking bass' illusion. This is the core of Skrillex's FM8 TalkWah / vowel-filter sound reproduced as pure EQ.
  - _On the synth:_ Use 3 bands as a formant cluster on the 12-band EQ. Band A = bell +6 to +9 dB, Q≈4–6, at the F1 zone (300–700 Hz). Band B = bell +7 to +9 dB, Q≈5–8, at the F2 zone (870 Hz for 'oo' → ~1150 Hz 'ah' → ~2300 Hz 'ee'). Band C = deep bell/notch −10 to −14 dB, Q≈3, parked between them (~700–1000 Hz) to carve the inter-formant gap. Because the EQ has no per-band freq LFO, you get the wobble two ways: automate Band B's Freq per preset variant for hard 'words', or ride the synth's morph + slow fmRate so the geometry's harmonic emphasis moves under the fixed formant mask. Optionally set Band B to upward dynamic so the vowel pops only on sustained notes.
- **Brostep low-mid scoop + spiky 1–3 kHz bite** — The classic brostep mid contour: gut the boxy low-mids so the sub and the bite own the spectrum, then jab a narrow presence peak into 1.5–3 kHz so the growl slices through a dense mix. This is the 'scooped low-mids with a spiky 1–3 kHz bite' signature.
  - _On the synth:_ Band = wide bell or tilt −4 to −8 dB, Q≈0.7–1.0, centered 250–500 Hz for the scoop. Second band = bell +4 to +6 dB, Q≈2.5–3.5, at 1.5–3 kHz for the bite (nudge toward 2 kHz for body, 3 kHz for more ice). On a lorenz/hyperstar patch with high harmonics the bite is already dense, so keep the boost conservative and lean on Q for the 'spike'.
- **Downward dynamic de-harsh / resonance suppression** — Tames the ice-pick 2–5 kHz spikes and high-mid harshness the wavefolder and high harmonics throw off, but only when the growl actually spikes — so the aggressive bite survives on the body of the note and the transient stab gets clamped. Dynamic EQ here beats a static cut, which would dull the whole sound.
  - _On the synth:_ Band = bell in downward-dynamic mode, freq 3–5 kHz, Threshold ≈ −18 dB, Ratio 4:1, Range −5 to −7 dB, fast Attack (~2–5 ms), medium Release (~80–150 ms). Add a second downward bell at 5–7 kHz (Thr −16, Ratio 3:1, Range −5 dB) for a de-esser-style tamer on the very top spit. Use per-band frequency-selective detection so only the harsh zone triggers it, not sub transients.
- **Fixed metallic-ring dynamic notch (fold-drive artifact control)** — The FOLD DRIVE wavefolder and high zHarm ratios on this synth create a fixed resonant 'ring' partial that sings out and reads as harsh/whistly. A frequency-selective dynamic notch ducks that one partial only when it rings, preserving the metallic character everywhere else.
  - _On the synth:_ Sweep a narrow bell (Q≈8–12) to find the ring (commonly 3.5–4.5 kHz with heavy fold drive), then set it to downward-dynamic: Threshold ≈ −20 dB, Ratio 6:1, Range −8 dB, fast Attack. Because detection is band-limited to that partial, sustained metallic content stays bright while the ring is leashed.
- **Sub-split low-end management (steep cut + dynamic sub-shelf duck)** — Enables the Skrillex layering rule — clean mono sub under distorted mids. A steep low-cut clears sub-rumble, and a downward dynamic low-shelf ducks the sub every time the mid growl gets loud so the two layers never fight for headroom.
  - _On the synth:_ Band 1 = low-cut at 28–35 Hz, 24 dB/oct (drop rumble/DC from the beam coordinates). Band 2 = low-shelf or 50–80 Hz bell in downward-dynamic mode, Threshold ≈ −18 dB, Ratio 3:1, Range −3 to −5 dB, medium Attack, keyed so loud mid-growl energy triggers the duck. When the planned Mid/Side placement ships, pin the sub band to Mid so the growl's stereo width never destabilizes the low end.
- **Upward growl-fill + air/tilt softening** — Two finishing moves: an upward dynamic bell fills the growl's body in the gaps between rhythmic gating so the bass stays thick and 'present' rather than choppy, and a high-shelf/tilt softens the digital fizz Skrillex mixes tame with a shelf cut above ~10 kHz.
  - _On the synth:_ Growl-fill = bell at 500 Hz–1.2 kHz in upward-dynamic mode, Threshold ≈ −24 dB, Ratio 2:1, Range +3 dB, slow-ish Attack, so it lifts only when the note dips below threshold. Air-soften = high-shelf −3 to −5 dB at 10–12 kHz, or a gentle tilt tilting energy out of the top, to kill wavefolder fizz without killing the metallic sheen.

**Presets (6):**

### Talking Reese Preacher  `[combined-patch]`
- **Style:** Skrillex / Kill The Noise talking-vowel reese bass ('Scary Monsters', 'Kyoto' lineage)
- **Goal:** A low, moving reese-style drone that morphs through vowels ('oo→ah→ee') like a preaching robot voice, thick on the bottom and spitting a bright bite up top.
- **Synth patch:** Generator: mobius (or torus) for the slowly-moving reese drone. baseFreq ~55 Hz (A1); high yHarm ratio for metallic buzz; FOLD DRIVE ~35–45%; SMOOTHING low-to-mid to keep brightness; fmRate slow (0.5–2 Hz) + moderate fmDepth for the vowel wobble; automate MORPH across the note to shift harmonic emphasis under the formant mask. Slight rotY for subtle stereo life. MIX ~85–90%.
- **EQ bands:**
  - **low-cut** @ sub 30 Hz · Q24 dB/oct — _Clear rumble/DC from the beam coordinates_
  - **bell** @ sub 50–60 Hz · +3 Q0.7 · dyn: downward, thr -18dB, ratio 3:1, range -4dB, medium attack (duck sub when mids spike) — _Keep sub weight under the growl_
  - **bell** @ low-mid 300–450 Hz (vowel F1) · +7 Q4 — _Throat/F1 formant peak_
  - **notch** @ low-mid 700–900 Hz · -12 Q3 — _Scoop the inter-formant gap that defines the vowel_
  - **bell** @ mid 1100 Hz → 2300 Hz (vowel F2) · +8 Q5 · dyn: upward, thr -22dB, ratio 2:1, range +3dB (pops vowel on sustains) — _Moving F2 peak — automate Freq (or ride synth morph) to 'talk' oo→ah→ee_
  - **bell** @ presence 2.5–3.5 kHz · +4 Q3 — _Spiky brostep bite so it cuts the mix_
  - **bell** @ high-mid 3.5–5 kHz · 0 static Q6 · dyn: downward, thr -18dB, ratio 4:1, range -6dB, fast attack ~3ms — _De-harsh the wavefolder ice-pick only on spikes_
  - **high-shelf** @ air 11 kHz+ · -4 Q0.7 — _Soften digital fizz_
- **Notes:** Author 5 snapshot variants by parking the F2 band at each vowel: OO 870 Hz, OH 900 Hz, AH 1150 Hz, EH 1850 Hz, EE 2300 Hz. Automating the F2 band's Freq between snapshots (or macro-mapping it) is what makes it 'speak'. Pairs with the Vowel-Morph Formant Bank for even more mouths.

### Metal Larynx Growl  `[combined-patch]`
- **Style:** Skrillex brostep tearout growl (aggressive FM8-through-Ohmicide lineage)
- **Goal:** A violent, metallic, chaotic growl — max aggression in the mids, scooped and biting, with the fixed metallic ring leashed so it stays musical.
- **Synth patch:** Generator: lorenz strange-attractor for chaotic metallic timbre (or hyperstar for spikier bite). Push xHarm/zHarm high; FOLD DRIVE ~55–65% for wavefolder density; small JITTER for grit; fmRate mid (growl rate) with high fmDepth; SMOOTHING low to keep it bright and nasty. baseFreq ~41–55 Hz. MIX ~90–95%.
- **EQ bands:**
  - **low-cut** @ sub 28 Hz · Q24 dB/oct — _Clean sub-rumble_
  - **bell** @ low-mid 250–500 Hz · -6 Q0.8 — _Wide brostep scoop of the mud/box_
  - **bell** @ presence 1.5–3 kHz · +5 Q2.5 — _Aggressive bite that slices through_
  - **notch** @ high-mid ~3.8–4.5 kHz · 0 static Q10 · dyn: downward, thr -20dB, ratio 6:1, range -8dB, fast attack — _Duck the fixed fold-drive metallic ring only when it sings_
  - **bell** @ high 5–7 kHz · 0 static Q4 · dyn: downward, thr -16dB, ratio 3:1, range -5dB, fast attack — _De-esser-style tamer on top spit_
  - **bell** @ low-mid 700 Hz–1.2 kHz · 0 static Q1.5 · dyn: upward, thr -24dB, ratio 2:1, range +3dB, slow attack — _Upward growl-fill between rhythmic gates so body stays thick_
  - **high-shelf** @ air 12 kHz+ · -3 Q0.7 — _Soften digital harshness_
- **Notes:** The dynamic notch is the load-bearing move — find the ring by soloing a narrow +12 dB sweep first, then flip it to downward-dynamic. Great candidate for the per-band ghost/dynamic-travel display since the ring and the 5–7 kHz tamer both visibly move.

### Robot Chatter Screech Lead  `[combined-patch]`
- **Style:** Skrillex metallic robotic vocal-formant lead / screech ('nasty EE' robot voice)
- **Goal:** A higher-register metallic screech-lead with a nasal 'EE/robot' formant character and fast chatter — sits above the growl as a talking topline.
- **Synth patch:** Generator: spiro (or butterfly) for dense comb-like harmonics; high zHarm; fmRate fast for chatter; FOLD DRIVE ~40%; SMOOTHING low; baseFreq in lead register ~110–220 Hz; add rotX/rotZ motion + persp for a metallic 3D shimmer. MIX ~80%.
- **EQ bands:**
  - **low-cut** @ low 80 Hz · Q12 dB/oct — _Strip sub — this layer is all mids/highs_
  - **bell** @ low-mid 300 Hz (F1) · +5 Q4 — _Vowel F1 anchor_
  - **notch** @ low-mid 1 kHz · -10 Q3 — _Scoop the inter-formant gap for the nasal EE_
  - **bell** @ high-mid 2300 Hz (F2, EE vowel) · +8 Q6 — _Nasal/robotic 'EE' formant that reads as a voice_
  - **bell** @ presence 3 kHz (F3) · +4 Q5 — _Robotic consonant edge_
  - **bell** @ high 4–6 kHz · 0 static Q5 · dyn: downward, thr -16dB, ratio 4:1, range -6dB, fast attack — _De-harsh the screech only on peaks_
  - **high-shelf** @ air 10 kHz+ · +2 Q0.7 — _Metallic sheen (boost) or soften (cut) to taste_
- **Notes:** The EE formant (high F2 ~2.3 kHz + big 1 kHz scoop) is what makes it 'robot-talk'. For a talking topline, snapshot this to AH/OH by lowering the F2 band and shrinking the notch.

### Vowel-Morph Formant Bank  `[eq-only-bank]`
- **Style:** Skrillex FM8 TalkWah / vowel-filter talking bass, as a drop-on EQ
- **Goal:** Turn ANY OsciSynth generator (or any layered sound) into a talking bass by stamping a movable vowel formant mask onto it. Ships tuned to 'AH' with A/E/I/O/U snapshots.
- **EQ bands:**
  - **bell** @ low-mid ~700 Hz (F1) · +7 Q4 — _Vowel F1 peak (throat)_
  - **notch** @ low-mid ~950 Hz · -12 Q3 — _Carve the inter-formant gap_
  - **bell** @ mid ~1150 Hz (F2, movable) · +8 Q5 — _Moving F2 peak — the 'mouth'; automate Freq to speak_
  - **bell** @ presence ~2.6 kHz (F3) · +3 Q4 — _Consonant/edge shimmer for intelligibility_
- **Notes:** Vowel snapshots (F1/F2 in Hz): OO 300/870, OH 500/900, AH 700/1150, EH 550/1850, EE 300/2300 — for OO/EE also drop F1 to ~300 and slide the notch accordingly. Macro-map the F2 band's Freq (and optionally the notch Freq/Q) to one knob so a single automation lane makes it talk. Layer over Talking Reese Preacher for a double-mouth effect.

### Brostep Scoop + Bite Bank  `[eq-only-bank]`
- **Style:** Generic Skrillex/brostep mid contour — scooped low-mids + 1–3 kHz bite + de-harsh
- **Goal:** Instantly give any bass the brostep frequency shape: hollowed low-mids, a spiky presence bite, harshness tamed dynamically, and a softened top.
- **EQ bands:**
  - **tilt** @ low-mid pivot ~500 Hz · -3 (low side) — _Tilt energy out of the mud toward clarity (or use as wide scoop)_
  - **bell** @ low-mid 300 Hz · -6 Q0.9 — _Deepen the scoop_
  - **bell** @ presence 2 kHz · +5 Q2.5 — _Spiky brostep bite_
  - **bell** @ high-mid 3.5–5 kHz · 0 static Q5 · dyn: downward, thr -18dB, ratio 4:1, range -6dB, fast attack — _Dynamic de-harsh so bite survives but stabs are clamped_
  - **high-shelf** @ air 11 kHz+ · -4 Q0.7 — _Soften digital fizz_
- **Notes:** The most reusable bank — drop on growls, reeses, even drums. If the source is already dark, back off the scoop and lean on the bite + de-harsh. Bite band toward 2 kHz = fuller, toward 3 kHz = more ice.

### Sub-Split Low-End Glue Bank  `[eq-only-bank]`
- **Style:** Skrillex layering rule — clean mono sub under distorted mids
- **Goal:** Manage the low end of a layered bass so a distorted growl and a clean sub coexist: steep cut, controlled sub weight, and a dynamic duck so the sub gets out of the growl's way.
- **EQ bands:**
  - **low-cut** @ sub 30 Hz · Q24 dB/oct — _Remove sub-rumble/DC the beam coordinates can generate_
  - **bell** @ sub 50 Hz · +3 Q0.7 — _Set the sub weight/fundamental_
  - **low-shelf** @ low 40–90 Hz · 0 static · dyn: downward, thr -18dB, ratio 3:1, range -4dB, medium attack, freq-selective detection — _Duck the sub whenever the mid growl gets loud (sidechain-style glue)_
  - **bell** @ low-mid 180–250 Hz · -3 Q1.2 — _Tidy the boxy overlap between sub and growl_
- **Notes:** Built for the distorted-mids-over-clean-sub split. When Mid/Side placement ships, pin bands 1–3 to Mid so the growl's stereo width never destabilizes the mono low end. Pair with Brostep Scoop + Bite Bank on the mid layer for a full Skrillex low-end/mid split.


---

## Moody Good

> Moody Good (Eddie Jefferys, ex-16bit / ex-Broken Note) makes woozy, abrasive, distortion-laden half-time bass across ragged-edge dubstep/grime, two-step and left-field hip-hop, plus the experimental glitch-texture world of the This Is The Investigation EP. The signature is heavy-but-controlled: a huge, clean sub anchoring a snarling, over-driven, deliberately broken/lo-fi mid, where the grit is loud but never ice-pick brittle — distortion into EQ into more distortion, then EQ again to tame. On OsciSynth Type 465 the distortion IS the geometry: FOLD DRIVE (wavefolder) supplies the harmonic explosion, JITTER supplies lo-fi grain/dirt, SMOOTHING tames the very top, and the lorenz/mobius generators supply chaotic, twisting, unstable textures a subtractive synth can't. The 12-band dynamic EQ then does the load-bearing work the FabFilter/Pro-Q way — a downward dynamic de-harsh clamps the fold fizz only when it spikes, an upward dynamic low-mid band re-inflates body the folding thins, surgical high-Q (dynamic) notches kill the metallic inharmonic rings, and a lo-fi tilt + dark high-cut band-limits the top for the broken texture.

**EQ techniques (this style):**

- **Dynamic de-harsh (downward fold-fizz clamp)** — The wavefolder sprays a cloud of upper-mid/high harmonics that turns to painful fizz on the loudest folds; a downward dynamic bell ducks a few dB ONLY in the instant the fizz pokes out, so the grit and dirt stay but the tone never goes brittle. This is the single most important move for making fold-drive read as 'dirty but musical' the way Moody Good's does.
  - _On the synth:_ 12-band EQ: Bell at 3.2 kHz, Q ~3.5, static Gain 0 dB, DYNAMIC = downward, Threshold -20 dB, Ratio 4:1, Range -6 dB, Attack ~5 ms (fast, catches the fold transient), Release ~120 ms. Add a twin Bell at ~5.5 kHz (Q 2.5, downward, Thr -18, Range -5). The per-band frequency-selective detector taps each band's own Freq/Q so only that fizz opens the reduction — dial FOLD DRIVE up freely and let these two bands police the top.
- **Low-mid weight anchor (upward dynamic body)** — Heavy folding plus a high-pass thins the 150-300 Hz 'chest' that makes bass feel physical; an upward dynamic bell re-inflates that body when the note sustains, giving Moody Good's heavy, woozy heft without leaving permanent mud when the sound is quiet.
  - _On the synth:_ Bell 200-240 Hz, Q 1.0, static +1.5 dB, DYNAMIC = upward, Threshold -28 dB, Ratio 2:1, Range +4 dB, Attack 20 ms, Release 200 ms — pushes weight UP only while the drone holds. Pair with a STATIC Bell -3 dB at ~380 Hz (Q 1.4) to scoop the boxy mud that sits just above it, so the added weight reads as chest, not honk.
- **Grit-growl presence lift (bell / tilt)** — The 'dirt' you actually hear on a phone or laptop lives 700 Hz-2 kHz; lifting it brings the folded harmonics forward so the bass snarls and cuts. Moody Good basses are aggressive in this band, which is what lets them punch through a busy grime/dubstep mix.
  - _On the synth:_ Bell 1.1 kHz, +2.5 dB, Q 1.0 — or a Tilt band pivoting ~800 Hz for a whole-spectrum shove toward the growl. While dialing FOLD DRIVE, drop a temporary Band-Pass 'grit-only' listen band (Freq 1 kHz, Q 2) to audition just the snarl, then delete it and keep the bell.
- **Sub-fundamental guard (mono low anchor + DC/rumble kill)** — Keeps the 40-70 Hz fundamental huge and clean under all the abuse, and removes the subsonic DC/rumble the X-Y beam can generate. Moody Good sits on a massive, controlled low end that the distortion is not allowed to eat.
  - _On the synth:_ Low-cut 24 dB/oct at ~28 Hz (kills DC/subsonic from the beam) + Bell 55 Hz, +3 dB, Q 0.8 for weight. Optional: a Low-shelf pivot ~90 Hz set DYNAMIC = upward (Range +3 dB, Threshold -30 dB, slow Attack 30 ms / Release 300 ms) that reinstates sub specifically when heavy folding thins the fundamental.
- **Lo-fi band-limit (tilt + dark high-cut)** — The broken, degraded, tape/vinyl/telephone-crushed texture of the This Is The Investigation world — roll the top off and tilt the spectrum dark so the sound reads as damaged rather than hi-fi. Turns a clean fold-drone into a lo-fi one.
  - _On the synth:_ High-cut 12-24 dB/oct at 7-9 kHz for darkness, plus a Tilt band (pivot ~1 kHz) tilted -3 dB toward the top for the degraded slope. For a broken/pumping lo-fi feel add a dynamic High-shelf (9 kHz, downward, Thr -18, Range -4) that ducks the top only on loud hits. Reach for heavier band-limiting (see the LO-FI eq-only bank) when you want the full telephone effect.
- **Surgical inharmonic notch cleanup (metallic-resonance tamer)** — Inharmonic xHarm/yHarm/zHarm ratios and the lorenz/mobius generators ring at ugly FIXED pitches; high-Q notches — made dynamic so they only bite when the partial rings — kill those stuck tones so the grit reads as musical noise, not a resonant whistle. This is the 'tame the beast' move unique to a geometric/attractor synth.
  - _On the synth:_ 2-3 Notch or very-high-Q Bell bands (Q 12-24) parked on the offending partials (sweep with a temporary +12 dB boost to find them; commonly ~900 Hz, ~1.7 kHz, ~4.3 kHz for metallic modes). Set each DYNAMIC = downward, Threshold -24 dB, Ratio 6:1, Range -8 dB, Attack 3 ms, Release 90 ms so they clamp only on the ring and leave the tone untouched elsewhere.

**Presets (6):**

### Sludgehammer 465  `[combined-patch]`
- **Style:** Moody Good — heavy half-time distorted bass (Moody Good LP era)
- **Goal:** A huge, woozy, half-time distorted bass drone: massive clean sub under a snarling, over-folded, controlled-fizz mid.
- **Synth patch:** Generator MOBIUS (twisting single-surface mid) — TORUS as an alt for a rounder drone. baseFreq low in the bass octave; FOLD DRIVE high (~65-75%) for a gnarly digital fold; SMOOTHING moderate to tame the very top post-fold; JITTER low-mid (~15%) for grain/dirt; xHarm/yHarm nudged slightly inharmonic for a metallic edge; fmRate slow + fmDepth moderate for the woozy half-time wobble; morph static-mid.
- **EQ bands:**
  - **low-cut** @ subsonic 28Hz · — (24 dB/oct) Q— — _Kill DC/subsonic the X-Y beam generates_
  - **bell** @ sub 55Hz · +3 Q0.8 — _Sub weight / fundamental_
  - **bell** @ low-mid 220Hz · +2 static Q1.0 · dyn: upward, thr -28dB, ratio 2:1, range +4dB, att 20ms, rel 200ms — _Re-inflate body/chest when the note holds_
  - **bell** @ low-mid 380Hz · -3 Q1.4 — _Scoop boxy mud above the body_
  - **bell** @ growl 1.1kHz · +2.5 Q1.0 — _Push the folded grit forward so it snarls/cuts_
  - **bell** @ presence 3.2kHz · 0 static Q3.5 · dyn: downward, thr -20dB, ratio 4:1, range -6dB, att 5ms, rel 120ms — _De-harsh: clamp fold fizz only on peaks_
  - **bell** @ upper fizz 5.5kHz · 0 static Q2.5 · dyn: downward, thr -18dB, ratio 3:1, range -5dB, fast attack — _Second de-harsh for the top of the fold spray_
  - **high-cut** @ air 11kHz+ · — Q— — _Darken / keep it heavy (12 dB/oct)_
- **Notes:** The two dynamic de-harsh bands are what let you crank FOLD DRIVE without the tone going brittle — set FOLD by ear against the 3.2/5.5 kHz ghost travel.

### Broken Investigation  `[combined-patch]`
- **Style:** Moody Good — This Is The Investigation textural/glitch EP
- **Goal:** An evolving, chaotic, glitchy textural drone — unstable and cinematic rather than a clean note; dark, degraded, broken.
- **Synth patch:** Generator LORENZ (strange attractor, self-evolving chaos) — unstable pitch drift is the point. baseFreq low; FOLD DRIVE moderate (~40-50%); JITTER high (~40%) for broken/grainy texture; SMOOTHING low-mid; morph slowly automated; fmRate very slow for drifting motion.
- **EQ bands:**
  - **low-cut** @ subsonic 30Hz · — (24 dB/oct) Q— — _DC/rumble guard_
  - **bell** @ sub 90Hz · +2 Q0.9 — _Keep a floor of weight under the chaos_
  - **notch** @ low-mid 900Hz · — Q18 · dyn: downward, thr -24dB, ratio 6:1, range -8dB, att 3ms, rel 90ms — _Kill the metallic ring the attractor parks on_
  - **notch** @ mid 1.7kHz · — Q16 · dyn: downward, thr -24dB, ratio 6:1, range -8dB — _Second stuck-resonance clamp_
  - **tilt** @ pivot 1kHz · -3 toward top Q— — _Lo-fi degraded downward slope toward the top_
  - **high-cut** @ air 7.5kHz+ · — Q— — _Dark textural top (18 dB/oct)_
- **Notes:** Sweep the two notches with a temporary +12 dB boost first to lock onto the attractor's ringing partials, then set them to notch + dynamic. Automate morph for the 'journey' feel of the EP.

### Grime Reese Mangler  `[combined-patch]`
- **Style:** Moody Good / 16bit — ragged grime-dubstep reese mid-bass
- **Goal:** A detuned, twisting, growling reese-style mid-bass with heavy movement and bite that cuts a busy 140/grime mix.
- **Synth patch:** Generator MOBIUS (or SPIRO for a thinner, more nasal reese). baseFreq in the bass; set xHarm/yHarm to a slightly beating ratio for a reese-like detune/beat; FOLD DRIVE ~55%; fmRate mid + fmDepth high for the wobble/movement; SMOOTHING low to keep bite; JITTER ~10% for edge.
- **EQ bands:**
  - **low-cut** @ subsonic 32Hz · — (24 dB/oct) Q— — _DC/rumble guard_
  - **bell** @ sub 70Hz · +2 Q0.9 — _Retain sub under the mid-bass_
  - **bell** @ low-mid 250Hz · -2.5 Q1.3 — _De-mud the reese_
  - **bell** @ growl 800Hz · +3 Q1.1 — _Bring the growl body forward_
  - **bell** @ bite 2.4kHz · +2 static Q1.6 · dyn: downward, thr -16dB, range -4dB — _Edge for cut-through, capped so peaks don't screech_
  - **bell** @ presence 4kHz · 0 static Q3.0 · dyn: downward, thr -20dB, ratio 4:1, range -6dB, fast attack — _De-harsh fold fizz_
  - **high-shelf** @ air 8kHz+ · -2 Q— — _Gentle darken_
- **Notes:** The 2.4 kHz bite band is a boost with a downward-dynamic ceiling — you get the cut on average level without the ear-fatiguing peaks when the wobble swings hard.

### DIRT — Weight & De-Harsh  `[eq-only-bank]`
- **Style:** Moody Good — universal grit-shaping bus (drop on ANY bass patch)
- **Goal:** The house 'make it dirty but musical' bank: anchor the sub, add dynamic low-mid weight, tame fold fizz, push the growl — the load-bearing Moody Good EQ moves with zero synth changes.
- **EQ bands:**
  - **low-cut** @ subsonic 26Hz · — Q— — _DC/rumble guard (12 dB/oct)_
  - **low-shelf** @ sub 90Hz · 0 static (+range) Q— · dyn: upward, thr -30dB, range +3dB, att 30ms, rel 300ms — _Reinstate sub only when folding thins it_
  - **bell** @ low-mid 210Hz · +2 Q1.0 — _Low-mid weight / chest_
  - **bell** @ low-mid 400Hz · -3 Q1.5 — _Mud scoop_
  - **bell** @ growl 1.2kHz · +2 Q1.0 — _Growl presence_
  - **bell** @ presence 3.3kHz · 0 static Q3.5 · dyn: downward, thr -20dB, ratio 4:1, range -6dB, att 5ms, rel 120ms — _Primary de-harsh clamp_
  - **bell** @ upper fizz 5.6kHz · 0 static Q2.5 · dyn: downward, thr -18dB, ratio 3:1, range -5dB — _Secondary de-harsh_
- **Notes:** Layerable EQ-only preset — swaps just the band set onto any generator/patch. This is the default 'grit floor' to reach for first; the two dynamic de-harsh bands do 80% of the Moody Good 'controlled dirt' character.

### LO-FI Broken Bus  `[eq-only-bank]`
- **Style:** Moody Good — degraded / textural lo-fi (telephone/tape crush)
- **Goal:** Band-limited, crushed, broken texture for any sound — the This Is The Investigation degraded aesthetic as a droppable bank.
- **EQ bands:**
  - **low-cut** @ lows up to 180Hz · — Q— — _Aggressive band-limit — telephone/small-speaker lows (24 dB/oct); blend back with global MIX for parallel_
  - **bell** @ mid 500Hz · +3 Q0.8 — _Midrange honk / lo-fi presence_
  - **tilt** @ pivot 1kHz · -4 toward top Q— — _Dark degraded slope toward the top_
  - **bell** @ mid 2kHz · 0 static Q2.0 · dyn: downward, thr -18dB, ratio 3:1, range -5dB — _Pump/duck the mid on hits for a broken feel_
  - **high-cut** @ top 6kHz+ · — Q— — _Crushed top (24 dB/oct)_
- **Notes:** Deliberately extreme band-limit. Use global MIX (dry/wet) to run it in parallel so you keep the real sub while smearing a crushed lo-fi layer on top.

### METAL — Resonance Cleanup  `[eq-only-bank]`
- **Style:** Moody Good — metallic/inharmonic resonance tamer
- **Goal:** Kill the stuck ringing tones from inharmonic xHarm/yHarm/zHarm ratios and lorenz/mobius drones while keeping all the grit — the essential companion bank for any heavily-folded geometric patch.
- **EQ bands:**
  - **notch** @ low-mid 900Hz · — Q20 · dyn: downward, thr -24dB, ratio 6:1, range -8dB, att 3ms, rel 90ms — _Clamp metallic mode 1 only when it rings_
  - **notch** @ mid 1.7kHz · — Q18 · dyn: downward, thr -24dB, ratio 6:1, range -8dB — _Clamp metallic mode 2_
  - **notch** @ presence 4.3kHz · — Q16 · dyn: downward, thr -22dB, ratio 5:1, range -7dB — _Clamp metallic top mode_
  - **bell** @ presence 3kHz · 0 static Q3.0 · dyn: downward, thr -20dB, range -6dB — _General de-harsh backstop_
- **Notes:** Find each partial by soloing a temporary high-boost bell and sweeping, then convert to notch + dynamic. Because the reduction is dynamic and frequency-selective, the tone is untouched except in the instant a specific partial rings out.


---

## Flume

> Flume's language is "sound design is king": mostly simple cores made strange by resampling, granular grain (~1-100 ms), heavy FM/fold saturation, and unconventional stereo, floated over lush wide detuned 7th/9th/11th chord stacks, a deep CLEAN sub that pitch-follows the chords ("moving floor"), hi-fi air sparkle, and chopped/formant vocal textures. That maps unusually well to the Type 465 because it is an X-Y oscilloscope synth: L=X, R=Y, so stereo width is INHERENT (decorrelate the axes via mismatched xHarm/yHarm, rotX/Y/Z, persp, zoom) and its generators (torus, super/bloom, lissajous, helix, mobius, lorenz) are already harmonically rich, buzzy and metallic — exactly the raw material Flume beats into shape. Two gotchas drive the EQ archetypes: (1) a scope beam readily produces DC/subsonic offset and very high aliased buzz, so a low-cut DC guard and a gentle high-cut are near-mandatory; (2) FOLD DRIVE + gentle FM pile odd harmonics into the 2-4 kHz "metallic" zone that spikes on chord/velocity peaks — the perfect job for DOWNWARD dynamic bells rather than static cuts, so the sparkle survives quiet passages and only the peaks get tamed. The 12-band dynamic EQ therefore does five recurring Flume jobs: DC/sub guard + sub shaping, frequency-selective kick/sub ducking for a clean low end, dynamic low-mid mud control, dynamic de-harsh/de-ess on the metallic and chop-sibilant bands, and a bright air shelf (with a width-feel high-shelf earmarked for the planned Mid/Side placement). Concepts ship as BOTH combined synth+EQ patches and layerable EQ-only banks.

**EQ techniques (this style):**

- **Bright hi-fi air shelf (Flume sparkle)** — Adds the sheen and 'expensive/open' top end future-bass leans on. Guides put air at a high-shelf 7-10 kHz for brightness and 10 kHz+ for pure air. On a scope synth the raw top is buzzy rather than airy, so the shelf is paired with de-harsh so you lift smooth air without amplifying the metallic grind.
  - _On the synth:_ High-shelf slot at 11 kHz, +3 to +6 dB, wide Q ~0.5. Optionally make it UPWARD-dynamic (thr -32 dB, ratio 2:1, range +3 dB, slow attack 60 ms / release 400 ms) so the air blooms only on sustained chord tails, not on transient buzz. Follow with a gentle high-cut at 18-19 kHz (12 dB/oct) to shave aliased ultra-buzz that the wavefolder/FM throw above the musical band.
- **DC / subsonic guard + clean-sub sculpt** — An X-Y beam with asymmetric X/Y easily parks a DC offset and rumble under 30 Hz that wastes headroom and smears the sub. Standard practice: high-pass below ~30-40 Hz, keep 40-80 Hz for the felt weight, and for a pure sub layer low-pass down toward ~100 Hz so it represents ONLY sub.
  - _On the synth:_ Low-cut (low slot) at 26-30 Hz, 24 dB/oct — DC/subsonic guard. Low-shelf +2 to +3 dB at 55-60 Hz for weight. On a dedicated sub patch add a high-cut at 110-120 Hz (24 dB/oct) so the beam's upper harmonics are gone and only the fundamental remains — the Type 465 way to fake a sine sub out of a rich generator (reinforce with heavy SMOOTHING + xHarm=yHarm=1 on the synth side).
- **Frequency-selective kick/sub duck (the 'moving floor')** — Keeps the deep sub and the kick from masking each other so the low end reads clean and punchy — pros do this as a narrow dynamic cut around the kick fundamental (~60-80 Hz) instead of full-range sidechain ducking, which sounds more transparent. Reinforces Flume's pitch-following sub without lows turning to soup.
  - _On the synth:_ Bell at 70 Hz, Q ~3, static gain 0, dynamic DOWNWARD: threshold -30 dB, ratio 8:1, range -6 dB, attack 2 ms, release 60-80 ms. On the sub/bus band its own frequency-selective detector clamps the sub each time low-end energy peaks, carving kick space; because the Type 465 sub is a smoothed low-harmonic torus/helix, one narrow band is enough.
- **Dynamic low-mid mud control on chord stacks** — Wide detuned chord stacks and beating xHarm/yHarm ratios pile energy at 150-500 Hz and go boxy; EDMProd's Flume method explicitly removes resonances ~150 Hz. Dynamic (not static) so the body stays warm in thin passages and only compresses when the stack blooms — 'boost/leave 300, compress when it detects too much level.'
  - _On the synth:_ Bell at 230-260 Hz, Q ~1.2, dynamic DOWNWARD: threshold -24 dB, ratio 3:1, range -4 to -5 dB, attack 15 ms, release 180 ms. Optional second static bell at 500 Hz, -2 dB, Q 1 to clear boxiness. Pairs with the synth's SMOOTHING (lowpass) but works dynamically so morph/FM movement doesn't get dulled.
- **Dynamic de-harsh / de-ess on metallic + chop bands** — FOLD DRIVE and gentle FM concentrate a metallic edge at 2-4 kHz that spikes on velocity/chord peaks; granular vocal chops and scope hiss add sibilant fizz at 5-8 kHz. A narrow downward dynamic band = a de-esser for both, taming only the peaks so overall brightness is retained (dynamic EQ 'tames resonance only when it crosses threshold').
  - _On the synth:_ Band A: bell 3.2 kHz, Q ~2.5, DOWNWARD thr -20 dB, ratio 4:1, range -5 dB, fast attack 3 ms / release 90 ms — kills the fold-drive metallic bark. Band B: bell 6.5 kHz, Q ~4, DOWNWARD thr -18 dB, ratio 4:1, range -5 dB, attack 1 ms / release 60 ms — de-esses chop sibilance and scope hiss. Set fmDepth/FOLD DRIVE first, then dial these to catch the resulting peaks.
- **Mid clarity presence bell** — The 1.5-2.5 kHz zone carries chord intricacy and lead cut-through; a gentle boost pushes leads/chords forward in a dense drop. EDMProd's Flume mix also boosts the mid channel in the low-mids (150-500 Hz) to push leads forward — the presence bell is the top half of that clarity move.
  - _On the synth:_ Bell at 1.8-2.5 kHz, +2 to +3 dB, Q ~1.5 for chord/lead clarity. Because L=X and R=Y, this presence lift also subtly sharpens the stereo trace; place it ABOVE the 3.2 kHz de-harsh band so you add intelligibility without re-introducing the metallic edge you just tamed.
- **Width-feel high-shelf (earmarked for planned Mid/Side)** — Future-bass width comes from boosting highs on the SIDES while keeping the low end mono/centered. On the Type 465 width is already generated in the synth (decorrelated X/Y), so the EQ's width job is tonal top-end lift; when Mid/Side placement lands, this shelf moves to Side-only for a textbook wide-top/mono-bottom image.
  - _On the synth:_ High-shelf at 12 kHz, +3 dB, wide Q — today applied full-band (both axes) as a sparkle lift; label the band 'SIDE when M/S available.' Keep the sub-region bands (kick duck, DC guard, sub shelf) reserved for MID/mono when M/S ships. Reinforce width on the synth side with slow rotX/Y/Z, persp and mismatched xHarm/yHarm rather than trying to widen with EQ.
- **Tilt for hi-fi vs lo-fi character** — One-move balance between Flume's glossy hi-fi sheen and his crunchy resampled/granular passages — a tilt pivots dark-and-thick against bright-and-airy in a single gesture, handy for automating a texture from grimy to pristine across a section.
  - _On the synth:_ Tilt band pivoting ~1 kHz: +2 to +3 dB tilt-up for the hi-fi chord/lead sound; automate to tilt-down (-2 dB) under granular/lorenz+jitter passages so resampled grit sits darker. Keep the DC low-cut and de-harsh bands active underneath so tilting up never uncovers rumble or metallic fizz.

**Presets (6):**

### Lantern Chords 465  `[combined-patch]`
- **Style:** Flume / Cashmere Cat lush wide detuned supersaw chord stack
- **Goal:** A big, breathing, hi-fi future-bass chord stack: wide and shimmering up top, tight and clean below, with the metallic scope edge tamed dynamically so it stays glossy on peaks.
- **Synth patch:** Torus generator (or super/bloom). baseFreq mid; set xHarm 3 / yHarm ~3.02 and zHarm ~5 so the axes beat against each other = detune/chorus width. morph slowly automated for evolving overtones. Gentle FM (fmRate ~5-6 Hz, fmDepth low) = chorus 'breathing.' FOLD DRIVE low-moderate for harmonic richness; SMOOTHING moderate to civilize buzz. Slow rotX/Y/Z + persp + slight zoom for unconventional stereo motion.
- **EQ bands:**
  - **low-cut** @ sub 28 Hz · Q24 dB/oct — _DC/subsonic guard — kill beam offset & rumble_
  - **bell** @ low-mid 250 Hz · 0 static / -4 dyn Q1.2 · dyn: downward, thr -24dB, ratio 3:1, range -4dB, attack 15ms, release 180ms — _tame stack mud/boxiness only when the chord blooms_
  - **bell** @ upper-mid 3.2 kHz · 0 static / -5 dyn Q2.5 · dyn: downward, thr -20dB, ratio 4:1, range -5dB, fast attack 3ms, release 90ms — _de-harsh the fold-drive/FM metallic edge on peaks_
  - **bell** @ clarity 1.8 kHz · +2.5 Q1.5 — _chord intricacy / presence lift_
  - **high-shelf** @ air 11 kHz · +4 Q0.5 · dyn: upward, thr -32dB, ratio 2:1, range +3dB, slow attack 60ms, release 400ms — _hi-fi sparkle; blooms on sustained tails_
  - **high-cut** @ ultra 19 kHz · Q12 dB/oct — _shave aliased ultra-buzz above the musical band_
- **Notes:** Automate morph + a slow filter/amp dip between chord phrases (cut reverb tails) to get the 'volume-control rhythm' Flume chord bounce. High-shelf labeled SIDE for the planned M/S upgrade.

### Glass Sub 465  `[combined-patch]`
- **Style:** Flume deep CLEAN pitch-following sub ('moving floor')
- **Goal:** A deep, round, mono-tight sub with zero mud that ducks cleanly around the kick and can pitch-follow the chords.
- **Synth patch:** Torus or helix at very low baseFreq; xHarm=yHarm=1 (near-circular trace = near-sine); zHarm off. HEAVY SMOOTHING (lowpass) to strip upper harmonics; FOLD DRIVE off; JITTER off; no rotation/persp (keep it centered/mono). Copy the chord pitch automation onto baseFreq for the moving-floor effect.
- **EQ bands:**
  - **low-cut** @ sub 22 Hz · Q24 dB/oct — _DC/subsonic guard_
  - **low-shelf** @ sub 55 Hz · +3 Q0.6 — _felt low-end weight_
  - **bell** @ sub 70 Hz · 0 static / -6 dyn Q3 · dyn: downward, thr -30dB, ratio 8:1, range -6dB, attack 2ms, release 70ms — _frequency-selective kick duck for a clean low end_
  - **bell** @ low-mid 180 Hz · -3 Q1 — _remove residual mud/boxiness_
  - **high-cut** @ low 115 Hz · Q24 dB/oct — _isolate the sub — pass ONLY sub frequencies_
- **Notes:** Keep every band MID/mono-oriented for when M/S placement ships. If the sub needs a touch of presence on small speakers, add a static +1.5 dB bell at 90 Hz BEFORE the high-cut.

### Vowel Chop Engine  `[combined-patch]`
- **Style:** Flume / Hi This Is Flume granular vocal-chop texture
- **Goal:** A morphing, formant-vowel, granular-grit chop-lead that reads like a mangled processed vocal, with sibilant fizz controlled and air added.
- **Synth patch:** Super/bloom (superformula) generator with morph SWEPT to shift the 'vowel' formant peaks. Gentle FM (fmRate ~6 Hz, fmDepth moderate) for wobble. JITTER moderate = granular grain/grit; FOLD DRIVE low for edge. Rotation for width. Resample-friendly: short-ish draws so chops feel time-sliced.
- **EQ bands:**
  - **low-cut** @ low 90 Hz · Q18 dB/oct — _chops don't need lows — clear space for sub_
  - **bell** @ low-mid 300 Hz · 0 static / -4 dyn Q1.5 · dyn: downward, thr -22dB, ratio 3:1, range -4dB, attack 12ms, release 150ms — _tame boxy formant resonance dynamically_
  - **bell** @ mid 700 Hz · +4 Q3 — _emphasize lower vowel formant (vowel-y body)_
  - **bell** @ upper-mid 1.8 kHz · +3 Q3 — _second formant — intelligibility/edge_
  - **bell** @ presence 6.5 kHz · 0 static / -5 dyn Q4 · dyn: downward, thr -18dB, ratio 4:1, range -5dB, fast attack 1ms, release 60ms — _de-ess chop sibilance & scope hiss_
  - **high-shelf** @ air 12 kHz · +3 Q0.5 — _ethereal sheen on the chop tail_
- **Notes:** Automating morph between the two formant bells (700 Hz & 1.8 kHz) gives moving vowels (ah->ee). Route occasional grains through more reverb/delay for Flume's ethereal chop moments.

### Ribbon Bend Lead  `[combined-patch]`
- **Style:** Flume pitch-bendy expressive future-bass lead
- **Goal:** A vocal-like, pitch-gliding lead with bite that cuts through the drop but never gets harsh, sitting cleanly above the bass.
- **Synth patch:** Lissajous or helix. Set xHarm:yHarm to the desired interval (e.g. 2:3) for a rich metallic core. Strong fmRate + fmDepth for the pitch-bend/vibrato glide (the 'ribbon'); automate fmDepth for scoops. Moderate FOLD DRIVE for bite; SMOOTHING moderate. Rotation for stereo life.
- **EQ bands:**
  - **low-cut** @ low 120 Hz · Q18 dB/oct — _lead sits above bass — no low-end clash_
  - **bell** @ low-mid 350 Hz · -2 Q1 — _clear low-mid so bend glides stay clean_
  - **bell** @ presence 2.5 kHz · +3 Q1.5 — _lead cut-through / presence_
  - **bell** @ upper-mid 3.8 kHz · 0 static / -4 dyn Q2.5 · dyn: downward, thr -20dB, ratio 3:1, range -4dB, attack 4ms, release 100ms — _tame fold-drive bark on velocity peaks_
  - **high-shelf** @ air 10 kHz · +3 Q0.5 — _top-end sheen_
- **Notes:** Because pitch is gliding, the 2.5 kHz presence bell is intentionally WIDE (Q1.5) so the formant peak doesn't zipper as the note bends through it.

### Flume Air & Clean-Sub Bus  `[eq-only-bank]`
- **Style:** Flume master/drop-bus tonal fingerprint
- **Goal:** A drop-on EQ bank that instantly gives any sound the Flume balance: DC-guarded clean sub, ducked low end, controlled mud, tamed metallic edge, and hi-fi air.
- **EQ bands:**
  - **low-cut** @ sub 26 Hz · Q24 dB/oct — _DC/subsonic guard_
  - **low-shelf** @ sub 60 Hz · +2 Q0.6 — _felt weight_
  - **bell** @ sub 70 Hz · 0 static / -5 dyn Q3 · dyn: downward, thr -28dB, ratio 6:1, range -5dB, attack 2ms, release 70ms — _frequency-selective kick/sub duck_
  - **bell** @ low-mid 260 Hz · 0 static / -4 dyn Q1.2 · dyn: downward, thr -24dB, ratio 3:1, range -4dB, attack 15ms, release 180ms — _dynamic mud control_
  - **bell** @ upper-mid 3.2 kHz · 0 static / -5 dyn Q2.5 · dyn: downward, thr -20dB, ratio 4:1, range -5dB, fast attack 3ms, release 90ms — _dynamic de-harsh of metallic peaks_
  - **high-shelf** @ air 11 kHz · +4 Q0.5 — _hi-fi sparkle (SIDE when M/S ships)_
  - **high-cut** @ ultra 18 kHz · Q12 dB/oct — _shave aliased ultra-buzz_
- **Notes:** General-purpose Flume bus tint; on a non-bass source you can bypass the two sub bands. All sub-region bands reserved for MID/mono at M/S upgrade.

### Chord-Stack Dynamic Tamer + Width  `[eq-only-bank]`
- **Style:** Flume dense-drop chord-stack control + wide-top feel
- **Goal:** Layer onto any lush/detuned stack to keep it glossy and wide under heavy layering: catches low-mid buildup and every harsh/sibilant peak, then lifts clarity and air for width feel.
- **EQ bands:**
  - **bell** @ low-mid 220 Hz · 0 static / -4 dyn Q1 · dyn: downward, thr -24dB, ratio 3:1, range -4dB, attack 15ms, release 170ms — _dynamic low-mid buildup control_
  - **bell** @ upper-mid 2.8 kHz · 0 static / -5 dyn Q3 · dyn: downward, thr -20dB, ratio 4:1, range -5dB, attack 3ms, release 90ms — _tame metallic chord peaks_
  - **bell** @ presence 6 kHz · 0 static / -4 dyn Q4 · dyn: downward, thr -18dB, ratio 4:1, range -4dB, fast attack 1ms, release 60ms — _de-ess sibilant chop/scope fizz_
  - **bell** @ clarity 1.6 kHz · +2 Q1.5 — _push chord intricacy forward_
  - **tilt** @ pivot ~1 kHz · +2 tilt-up — _hi-fi vs lo-fi character in one move_
  - **high-shelf** @ air 12 kHz · +3 Q0.5 — _width sparkle (SIDE when M/S available)_
- **Notes:** The tilt lets you automate a section from pristine (tilt up) to gritty/resampled (tilt down) without touching individual bands; the three downward bands hold the stack together underneath either way.


---

## Rezz

> REZZ's signature is dark, hypnotic, mid-tempo (90-110 BPM; e.g. "Suffer in Silence" at 97 BPM) minimalism: a droning, resonant "wub" mid-bass whose whole character lives in the 200Hz-1kHz band, sitting over a tight, controlled sub, with eerie Locrian (♭2/♭5, tritone) tonality and SLOW, narrow resonant movement instead of a busy arrangement. Her toolchain is deliberately simple — Serum drone presets, Xfer LFOTool for the wobble, FabFilter Saturn 2 saturation and Ableton Redux downsampling for industrial grit — and her rule is "hypnotic music is simple, bold, and repetitive, but not too repetitive." On the OsciSynth Type 465 this maps cleanly: the droning geometric generators (mobius / spiro / helix) run at a LOW baseFreq drone with slow morph and moderate fmRate+fmDepth (the global draw-freq vibrato LFO) to create the wub sway, moderate FOLD DRIVE for the buzzy metallic grit, and SMOOTHING pulled back so it stays dark. The instrument's raw output is already harmonically rich and vocal/formant-like — exactly the material REZZ shapes. The 12-band dynamic EQ then does the "producer" half: a narrow, threshold-triggered resonant BELL in the 300Hz-1kHz growl zone supplies the moving formant that makes the drone "talk"; a downward-dynamic band clamps the tight sub; a wide downward band around 200-350Hz clears low-mid mud only on the loudest hits; and dynamic notches in the 2.5-5kHz presence + air region de-harsh the metallic oscilloscope overtones so the eerie top stays unsettling but never fatiguing. The result is a hypnotic, psychological drone that swings like REZZ's basses while keeping her tight, minimal low-end discipline.

**EQ techniques (this style):**

- **Moving Resonant Growl Bell (the wub formant)** — Creates the vocal, moving resonant peak in the 300Hz-1kHz 'growl' band that is the entire identity of a REZZ wub. Because a real REZZ bass is an LFO sweeping a resonant filter cutoff, on this synth the sweep comes from the generator's fmRate/morph motion while the dynamic EQ bell ACCENTS a fixed formant that surges with the note — the per-band ghost travel becomes the visible 'wub'. Its threshold-triggered rise makes the drone breathe and 'talk' rhythmically.
  - _On the synth:_ 12-band EQ: one BELL at 550Hz (park anywhere 300Hz-1kHz to taste), Q ~10-14 (very narrow), static Gain 0dB. Set BIDIRECTIONAL mode to UPWARD, Range +7dB, Threshold -22dB, Ratio ~3:1, Attack 25ms (slow enough to swing, not click), Release 180ms. Detection is frequency-selective on the same 550Hz band so only the drone's mid energy opens it. Sync the synth's fmRate to a slow value and add a second static bell an octave up (~1.1kHz, Q 8, +3dB) for a vowel-pair formant.
- **Tight-Sub Clamp (controlled low end)** — Delivers REZZ's tight, disciplined sub — present and solid but never ballooning or booming on sustained drones. A downward-dynamic band on the fundamental keeps only the loudest sustained hits from swelling, so the sub stays punchy and mono-solid under the mid-drone rather than washing the mix.
  - _On the synth:_ Low-end slot as LOW-CUT at 28Hz, 24dB/oct slope to kill DC/rumble from the beam. Then a BELL at 55Hz, Q 1.2, DOWNWARD dynamic, Range -5dB, Threshold -14dB, Ratio 4:1, Attack 8ms (fast), Release 120ms — clamps sub swell on the drone's peaks. Optional static LOW-SHELF at 45Hz, +2dB for weight underneath the clamp. baseFreq on the synth sets this fundamental, so tune the band to the played root.
- **Low-Mid Mud Decongestion (dynamic 200-350Hz duck)** — Keeps the sustained drone from congesting the 200-350Hz mud zone WITHOUT hollowing out the body during quieter passages. Wide, downward, and threshold-gated so it only pulls back when the drone is loud and thick — the classic dynamic-EQ decongestion move that preserves the hypnotic fullness at low level.
  - _On the synth:_ BELL at 260Hz, Q 1.5 (wide), static Gain 0dB, DOWNWARD dynamic, Range -6dB, Threshold -18dB, Ratio 3:1, Attack 12ms, Release 150ms, frequency-selective detection on the band. Because the mobius/spiro generators dump a lot of energy here, this band is what stops the drone from turning to porridge.
- **Metallic De-Harsh Dynamic Notches (eerie top, no fatigue)** — Tames the ice-pick, buzzy overtones the oscilloscope generators and FOLD DRIVE wavefolder throw into the 2.5-5kHz presence region — but only when they spike, so the eerie industrial sheen and 'observing horror' edge stay intact while the sound never becomes fatiguing on a loop.
  - _On the synth:_ Two BELLs: 3.2kHz Q 8 and 4.5kHz Q 10, both static 0dB, DOWNWARD dynamic, Range -5dB, Threshold -20dB, Ratio 4:1, Attack 3ms (fast, catches transients), Release 90ms. Frequency-selective detection so only genuine harsh spikes duck. Pairs with pulling SMOOTHING up slightly on the synth.
- **Industrial Dark-Tilt / Air Control** — Pushes the overall tone dark and 'industrial/mature' the way REZZ describes her later sound, and controls the brittle top the beam produces. A gentle high-cut + downward tilt darkens without killing the unsettling metallic character; a small dynamic air-notch keeps hiss/glare from Redux-style grit in check.
  - _On the synth:_ TILT band pivoting ~700Hz, tilting -2dB toward the highs for a static dark slope. HIGH-CUT slot at 11kHz, 12dB/oct gentle slope. Optional BELL at 9kHz, Q 6, DOWNWARD dynamic, Range -4dB, Threshold -24dB, Attack 2ms, Release 70ms to duck air glare on the loudest, grittiest hits. Use global MIX ~85-100% wet and trim OUT to stage into the master.
- **Locrian Formant Vowel-Pair (psychological talk-drone)** — Two offset narrow bells act like mouth formants; when both are dynamic with slightly different thresholds/releases they open out of phase with each other, giving the drone a talking / breathing, almost-vocal quality that reads as eerie and psychological — the hypnotic 'CAN YOU SEE ME?' character rather than a static bass.
  - _On the synth:_ BELL A at 420Hz Q 12, UPWARD, Range +6dB, Threshold -22dB, Release 140ms. BELL B at 900Hz Q 12, UPWARD, Range +5dB, Threshold -26dB, Release 260ms (deliberately longer so it lags A). Both frequency-selective. Drive the whole thing with the synth's slow fmRate so the beam already sways; the offset bells add the vowel morph on top of the ghost travel.

**Presets (5):**

### Witching Hour Drone  `[combined-patch]`
- **Style:** REZZ - 'Witching Hour' / 'Edge' style droning wub mid-bass
- **Goal:** A dark, hypnotic mid-tempo drone whose resonant 'wub' formant swings slowly around 300-1kHz over a tight, controlled sub — the flagship REZZ combined patch.
- **Synth patch:** MOBIUS generator (single-surface, endless drone). LOW baseFreq for a bass-register drone; drawSpd moderate; xHarm/yHarm set to a slightly inharmonic ratio (~3:2 vs 2:1) to seed a tritone-ish beating that reads as Locrian ♭5 unease. morph slow (glacial). fmRate slow + fmDepth moderate = the wub vibrato sway. FOLD DRIVE moderate for buzzy grit; SMOOTHING ~40% so it stays dark; JITTER low for a faint industrial texture. Slow rotY for subtle stereo/timbral drift.
- **EQ bands:**
  - **low-cut** @ sub 28Hz · Q24dB/oct slope — _Kill DC/rumble from the beam so the sub is clean_
  - **low-shelf** @ sub 45Hz · +2 — _Weight/body under the clamp_
  - **bell** @ sub 55Hz · 0 static Q1.2 · dyn: downward, thr -14dB, ratio 4:1, range -5dB, fast attack 8ms, release 120ms — _Tight-sub clamp so the fundamental never balloons_
  - **bell** @ low-mid 260Hz · 0 static Q1.5 · dyn: downward, thr -18dB, ratio 3:1, range -6dB, attack 12ms, release 150ms — _Decongest mud only on the loudest drone hits_
  - **bell** @ growl 550Hz · 0 static Q12 · dyn: upward, thr -22dB, ratio 3:1, range +7dB, attack 25ms, release 180ms, freq-selective — _The moving resonant wub formant that makes the drone talk_
  - **bell** @ upper-mid 1.1kHz · +3 Q8 — _Static companion formant for a vowel-pair color_
  - **bell** @ presence 3.2kHz · 0 static Q8 · dyn: downward, thr -20dB, ratio 4:1, range -5dB, fast attack 3ms, release 90ms — _De-harsh metallic spikes from the wavefolder_
  - **high-cut** @ air 11kHz · Q12dB/oct gentle slope — _Darken to REZZ's industrial top_
- **Notes:** Global MIX 100% wet. This is the reference REZZ combined patch; play it in B Locrian and hold notes for the hypnotic drone.

### Locrian Pendulum Bass  `[combined-patch]`
- **Style:** REZZ - 'Suffer in Silence' (B Locrian, 97 BPM) mid-tempo swing
- **Goal:** A slower, more melodic REZZ bass that swings like a pendulum — designed to be played as a syncopated Locrian bassline (♭2/♭5) rather than a single held drone.
- **Synth patch:** SPIRO generator for a rounder, more tonal drone with clear pitch. LOW baseFreq; xHarm/yHarm/zHarm tuned to expose the ♭2 and ♭5 partials so tritone tension is baked into the timbre. fmRate slower than Witching Hour (a lazy swing), fmDepth moderate. morph automate slowly across a phrase. FOLD DRIVE light; SMOOTHING ~50% (rounder, less brittle); JITTER off.
- **EQ bands:**
  - **low-cut** @ sub 30Hz · Q18dB/oct — _Clean the very bottom_
  - **bell** @ sub 60Hz · 0 static Q1.3 · dyn: downward, thr -14dB, ratio 4:1, range -5dB, attack 8ms, release 110ms — _Tight-sub clamp on played root notes_
  - **bell** @ low-mid 420Hz · 0 static Q12 · dyn: upward, thr -22dB, range +6dB, release 140ms, freq-selective — _Vowel formant A — leads the talk-drone_
  - **bell** @ mid 900Hz · 0 static Q12 · dyn: upward, thr -26dB, range +5dB, release 260ms, freq-selective — _Vowel formant B — lags A for a moving mouth-like character_
  - **tilt** @ pivot 700Hz · -2 toward highs — _Overall dark industrial slope_
  - **bell** @ presence 4.5kHz · 0 static Q10 · dyn: downward, thr -20dB, ratio 4:1, range -5dB, attack 3ms, release 90ms — _Duck harsh top only when it spikes_
- **Notes:** Best sequenced as 1/8 notes shortened to 1/16 for REZZ's syncopation, with octave jumps on the backbeat.

### Hypnotic Vowel Wub (EQ bank)  `[eq-only-bank]`
- **Style:** REZZ moving-formant 'talking' wub character
- **Goal:** Drop the REZZ moving-resonant vowel character onto ANY existing drone, bass, or pad so it starts to 'talk' and breathe without touching the source synth.
- **EQ bands:**
  - **bell** @ low-mid 420Hz · 0 static Q12 · dyn: upward, thr -22dB, ratio 3:1, range +6dB, attack 25ms, release 140ms, freq-selective — _Formant A (leads)_
  - **bell** @ growl 620Hz · 0 static Q11 · dyn: upward, thr -20dB, ratio 3:1, range +7dB, attack 22ms, release 180ms, freq-selective — _Center growl peak — the main wub_
  - **bell** @ mid 950Hz · 0 static Q12 · dyn: upward, thr -26dB, range +5dB, release 260ms, freq-selective — _Formant B (lags for movement)_
  - **bell** @ low-mid 260Hz · 0 static Q1.5 · dyn: downward, thr -18dB, range -4dB, release 150ms — _Keep the added resonance from muddying up_
- **Notes:** Layerable utility. Because the three upward bells share overlapping detection but different releases, they open out of phase and animate a static source. Pair with a slow host LFO on nothing — the dynamics ARE the movement.

### Industrial Sub Clamp (EQ bank)  `[eq-only-bank]`
- **Style:** REZZ tight, controlled, mono low-end discipline
- **Goal:** A drop-on chain that makes any bass low-end REZZ-tight: clean, mono-solid, punchy, and clamped so sustained notes never boom or wash — pure low-end control, no tone-shaping up top.
- **EQ bands:**
  - **low-cut** @ sub 28Hz · Q24dB/oct slope — _Remove sub-audible rumble/DC_
  - **low-shelf** @ sub 45Hz · +2 — _Solid foundation weight_
  - **bell** @ sub 55Hz · 0 static Q1.2 · dyn: downward, thr -14dB, ratio 4:1, range -5dB, attack 8ms, release 120ms — _Clamp fundamental swell on the loudest hits_
  - **bell** @ upper-bass 95Hz · 0 static Q2 · dyn: downward, thr -16dB, ratio 3:1, range -4dB, attack 10ms, release 140ms — _Tame the second-harmonic boom that balloons on drones_
  - **bell** @ low-mid 220Hz · 0 static Q1.4 · dyn: downward, thr -18dB, ratio 3:1, range -5dB, attack 12ms, release 150ms — _Wide dynamic mud duck for clarity under a mix_
- **Notes:** Mid/Side placement is planned for a later EQ revision — when it lands, set these to MID so the sub stays mono and the stereo sides keep the drone width. Until then it's a mono-friendly clamp chain.

### Mangled Metal Helix (combined-patch)  `[combined-patch]`
- **Style:** REZZ industrial / 'CAN YOU SEE ME?' distorted, downsampled grit (Saturn 2 + Redux)
- **Goal:** The harshest, most industrial REZZ variant — a distorted, bit-crushed metallic drone for drops and horror-film tension, aggressively de-harshed so it stays controlled.
- **Synth patch:** HELIX generator (tight helical winding = dense buzzy overtones). LOW baseFreq; high FOLD DRIVE for wavefolder distortion (the Saturn 2 role); JITTER moderate-high to emulate Redux downsampling/bit-reduction grit; SMOOTHING low so it bites; fmRate mid + fmDepth high for an aggressive wobble; slight rotX/rotZ for a lurching, unstable feel.
- **EQ bands:**
  - **low-cut** @ sub 30Hz · Q24dB/oct — _Stop distortion junk below the fundamental_
  - **bell** @ sub 58Hz · 0 static Q1.2 · dyn: downward, thr -13dB, ratio 5:1, range -6dB, attack 6ms, release 100ms — _Keep the distorted sub tight_
  - **bell** @ growl 500Hz · +4 static Q9 · dyn: upward, thr -20dB, range +5dB, attack 20ms, release 160ms, freq-selective — _Push the aggressive growl formant forward_
  - **notch** @ low-mid 340Hz · Q20 (very narrow) — _Surgically kill a nasty resonant honk the folder produces_
  - **bell** @ presence 3.5kHz · 0 static Q8 · dyn: downward, thr -22dB, ratio 5:1, range -7dB, attack 2ms, release 80ms — _Heavy de-harsh — distortion throws lots of energy here_
  - **bell** @ presence 5kHz · 0 static Q10 · dyn: downward, thr -22dB, ratio 5:1, range -6dB, attack 2ms, release 70ms — _Second de-harsh notch for ice-pick spikes_
  - **high-cut** @ air 9kHz · Q12dB/oct — _Cap the fizz for a dark industrial ceiling_
- **Notes:** Global MIX 100%, OUT trim -3dB to leave headroom — this patch is loud and dense. The two fast downward presence notches are essential; without them the folded/jittered helix is unlistenable on a loop.


---

## Levity

> LEVITY (Chicago new-gen bass trio, Coachella 2026 Sahara breakout; tracks "Flip It", "One For You", "Postman", "Can't Get Enough") sit at the wonky/melodic-heavy edge of modern dubstep: groovy "mind-altering wubs" over euphoric, indie-vocal-led, cinematic beds. Sources on LEVITY are thin on technical detail, so this facet generalizes from the broader modern-melodic / UKF-era deep-dubstep playbook (Seven Lions-style walls of pads, DnB-lineage reese design, formant growls) that their sound clearly descends from. The signature is CONTRAST: a pristine, mono, buzz-free sub foundation under aggressively designed but tastefully tamed mid-bass, all wrapped in wide, airy, reverberant space. Mapping this to the OsciSynth Type 465 is the interesting problem: it is a harmonically rich, buzzy/metallic FM-additive oscilloscope synth, so "clean and deep" is NOT its native voice — you get there by choosing near-circular generators (Lissajous at simple ratios ≈ sine), pinning harmonics low, driving SMOOTHING hard, and letting the dynamic EQ do the final sculpting/isolation. The buzzy generators (super/butterfly/spiro/lorenz) instead become the reese, growl and atmosphere engines, and the 12-band dynamic EQ carries the "polish + tame the drop" half of the aesthetic: clean sub shelf, surgical mid bells, formant carving, air shelves, and downward dynamic bells that only clamp the 2-5 kHz screech and 6-8 kHz splash when they actually spike.

**EQ techniques (this style):**

- **Clean sub isolation (low-shelf + high-cut fence)** — Turns a harmonically messy oscilloscope tone into a pure, weighty, mono sub by shelving up the fundamental and hard-fencing everything above it, so the sub layer never clutters the mid-bass or muddies the low mids.
  - _On the synth:_ Band 1 low-shelf @ 45-55 Hz, +3 to +5 dB, Q 0.7 (static) for weight; the LOW-END slot as a low-cut @ 20-24 Hz slope 24 dB/oct to kill infrasonic rumble the Lissajous beam produces; Band 2 high-cut @ 110-130 Hz slope 24 dB/oct to strip the metallic upper harmonics this synth always generates. On the 465 this fence is mandatory because even a 1:1 Lissajous still leaks buzz — SMOOTHING alone won't fully clean it.
- **Downward dynamic sub-leveller (self-detected)** — Keeps the sub perceptually constant — clamps note-attack blooms and resonant low swells so the low end stays flat and loud without clipping, the cleaner cousin of low-band compression. (No external kick key exists yet, so it self-detects on its own band-limited low content.)
  - _On the synth:_ Band 3 bell @ 60-80 Hz, downward mode, threshold -12 dB, ratio 3:1, range -4 dB, attack ~5 ms (fast), release ~120 ms. Frequency-selective detection is scoped to the band so only sub blooms trigger it; the per-band ghost shows the low end 'breathing' back to level.
- **Designed-mid bell sculpt (mud notch + presence + body)** — Shapes a raw reese/mid generator into a mix-ready designed bass: removes 250 Hz box/mud, restores 300-500 Hz body if the detune thins it, and lifts 1.5-3 kHz presence so it cuts on phones and club rigs alike.
  - _On the synth:_ Band @ 250 Hz -3 dB Q 1.2 (de-mud); Band @ 350-450 Hz +2 dB Q 0.8 wide (body-save — the 465's inharmonic xHarm/yHarm beating often hollows this out); Band @ 1.8-2.5 kHz +2 to +3 dB Q 1.0 (presence). All static — this is the fixed 'design' layer beneath the dynamic taming.
- **Dynamic drop-energy taming (downward bells @ 2-5 kHz)** — The core 'refined-but-heavy' move: lets the reese/growl stay aggressive and bright but automatically clamps the harsh 2-5 kHz screech ONLY on the peaks, so the drop is loud and controlled instead of ear-shredding.
  - _On the synth:_ Band @ 2.5 kHz + a second @ 3.5-4 kHz, both downward, threshold -18 dB, ratio 4:1, range -6 dB, fast attack (~3 ms) / medium release (~150 ms). Pair with the 465's FOLD DRIVE turned UP for grit — the wavefolder adds exactly the 2-5 kHz spikes these bands then police, so you can be more aggressive at the source.
- **Formant / vowel carving (fixed resonant bells)** — Imposes a talking/vowel character on a growl by boosting fixed formant bumps, turning a generic buzz into a LEVITY-style 'wub' that reads as a voice.
  - _On the synth:_ Three fixed bells acting as formants: ~400 Hz +4 Q 2 ('aw'), ~900 Hz +3 Q 2 (throat/body), ~2100 Hz +3 Q 2 ('ee'/edge). Drive the super/butterfly generator's morph and fmRate to make the underlying spectrum shift under these static formant windows — the beam's changing harmonics sweeping past fixed EQ bumps is what makes it 'articulate'.
- **De-ess / resonance notch (narrow downward notch)** — Surgically tames the single nastiest resonant frequency or cymbal-clash/sibilant splash without dulling the whole top — applied to growls, hats, and full drops.
  - _On the synth:_ Narrow bell/notch @ 6-8 kHz, Q 6-9, downward, threshold -18 to -20 dB, range -8 dB, very fast attack. On growl patches also add a dynamic notch @ 5-6 kHz to catch the fold-drive whistle; the frequency-selective detector keeps it dormant until that exact band spikes.
- **Air + tilt polish (high-shelf sheen)** — The final 'expensive/polished' sheen — opens the top for pads, leads and the master glue without adding hiss, and a gentle tilt brightens the whole balance toward the melodic-dubstep hi-fi aesthetic.
  - _On the synth:_ HIGH-END slot / Band as high-shelf @ 9-12 kHz, +2 to +3 dB (static); optional Tilt pivoting ~1 kHz nudged up for overall brightness. Because the 465's SMOOTHING lowpass rolls off the very top of pads/subs, this shelf 're-buys' controlled air above where the buzz lived, rather than un-muting raw metallic content.

**Presets (7):**

### Glassfall Sub  `[combined-patch]`
- **Style:** LEVITY / deep-dubstep pristine mono sub foundation
- **Goal:** Rock-solid, buzz-free, mono deep sub — the clean weight the whole drop rides on.
- **Synth patch:** LISSAJOUS generator at 1:1 xHarm:yHarm (near-perfect circle ≈ dual-sine → cleanest tone the 465 can make). baseFreq low (~30-55 Hz drone range), morph ≈ 0, xHarm=yHarm=1, zHarm off, fmRate/fmDepth OFF (no vibrato — subs must be pitch-stable), FOLD DRIVE off, SMOOTHING high (kill residual metallic buzz), JITTER 0, no rotX/Y/Z and neutral zoom/persp so L=R stays mono-summable.
- **EQ bands:**
  - **low-cut** @ infrasonic 20-24Hz · Qslope 24 dB/oct — _Remove sub-audible rumble that eats headroom_
  - **low-shelf** @ sub 45-55Hz · +3 to +5 Q0.7 — _Add fundamental weight/thump_
  - **bell** @ sub 60-80Hz · 0 (dynamic) Q1.0 · dyn: downward, thr -12dB, ratio 3:1, range -4dB, fast attack ~5ms, rel ~120ms — _Self-detected sub leveller so note blooms don't clip_
  - **high-cut** @ low 110-130Hz · Qslope 24 dB/oct — _Fence off metallic upper harmonics so the sub stays pure and out of the reese's zone_
- **Notes:** Mono the low end. Designed to sit UNDER Reese Cathedral / Vowel Engine, which are high-passed at ~90-100 Hz to leave this layer alone.

### Reese Cathedral  `[combined-patch]`
- **Style:** Modern melodic-dubstep / DnB-lineage designed reese mid-bass (UKF-era deep dubstep)
- **Goal:** Wide, pulsating, emotional reese that growls but never screeches — the melodic drop's backbone.
- **Synth patch:** HELIX generator (or MOBIUS for more twist). Detune-style beating via mismatched axis harmonics: xHarm 3:2 vs yHarm ~3.01 (slight offset = reese chorus/beating). fmRate slow (~0.2-0.5 Hz) + moderate fmDepth for the classic pulsating reese sweep. FOLD DRIVE moderate (grit + the 2-5 kHz spikes the dynamic band then tames). SMOOTHING medium to cap top buzz. Slow rotY + mild persp for stereo motion/width.
- **EQ bands:**
  - **low-cut** @ low 90Hz · Qslope 24 dB/oct — _Clear space for the Glassfall sub layer_
  - **bell** @ low-mid 250Hz · -3 Q1.2 — _Kill box/mud_
  - **bell** @ low-mid 350-450Hz · +2 Q0.8 — _Body-save (detune beating hollows this out)_
  - **bell** @ presence 1.8-2.5kHz · +2 Q1.0 — _Cut through the mix_
  - **bell** @ high-mid 2.5-4kHz · 0 (dynamic) Q1.5 · dyn: downward, thr -18dB, ratio 4:1, range -6dB, fast attack ~3ms, rel ~150ms — _Tame reese screech on peaks only_
  - **high-shelf** @ air 10kHz · +2 Q0.7 — _Re-buy controlled air above the buzz zone_
- **Notes:** The load-bearing pairing: push FOLD DRIVE for character at the source, then let the 2.5-4 kHz downward band police it — aggressive but polished.

### Vowel Engine Growl  `[combined-patch]`
- **Style:** LEVITY wonky 'wub' / formant growl mid-bass
- **Goal:** A talking, vowel-morphing growl that reads as a voice — aggressive but de-harshed and de-essed so it stays refined.
- **Synth patch:** SUPER (superformula/bloom) generator (or BUTTERFLY for a nastier edge). Dense spectrum via higher xHarm/yHarm/zHarm; fmRate rhythmic/faster + high fmDepth for talking motion; FOLD DRIVE high for the spectral bumps that imply formants; SMOOTHING low-medium; automate morph for the vowel sweep. The changing harmonics passing under the fixed formant bells below is what makes it articulate.
- **EQ bands:**
  - **low-cut** @ low 100Hz · Qslope 18 dB/oct — _Keep it above the sub_
  - **bell** @ low-mid 400Hz · +4 Q2.0 — _'Aw' formant bump_
  - **bell** @ mid 900Hz · +3 Q2.0 — _Throat/body formant_
  - **bell** @ high-mid 2100Hz · +3 Q2.0 — _'Ee' formant / edge_
  - **bell** @ high-mid 3.5kHz · 0 (dynamic) Q1.5 · dyn: downward, thr -16dB, ratio 5:1, range -7dB, fast attack ~3ms — _Clamp harsh screech spikes_
  - **notch** @ presence 5-6kHz · 0 (dynamic) Q8.0 · dyn: downward, thr -18dB, range -8dB, very fast attack — _De-ess / kill fold-drive whistle when it spikes_
  - **high-shelf** @ air 12kHz · +1.5 Q0.7 — _Final sheen_
- **Notes:** Formant bells are STATIC windows; the movement comes from the synth's morph/fmRate sweeping harmonics past them. Two downward bands keep the aggression tasteful.

### Aurora Pad Bed  `[combined-patch]`
- **Style:** Spacey wide atmospheric melodic-dubstep pad (Seven Lions-style cinematic wall)
- **Goal:** Lush, wide, emotional pad/atmosphere bed with airy top and no low-mid clutter — the euphoric backdrop under the drop.
- **Synth patch:** HYPERSTAR generator (or SPIRO for shimmer). Slow drawSpd, low-to-moderate harmonics, high SMOOTHING for a soft lush timbre; slow rotX/rotY/rotZ + persp + gentle zoom motion for evolving 3D stereo width; FOLD DRIVE off/low; baseFreq mid; long phosphor persistence for a smeared, reverberant feel.
- **EQ bands:**
  - **low-cut** @ low 130-150Hz · Qslope 12 dB/oct — _Keep the pad out of the bass zone_
  - **bell** @ low-mid 300Hz · -3 Q1.0 — _De-mud so stacked chords stay clear_
  - **bell** @ high-mid 3.5-4kHz · 0 (dynamic) Q1.2 · dyn: downward, thr -20dB, ratio 3:1, range -4dB, medium attack — _De-harsh when chords stack and beat_
  - **high-shelf** @ air 9kHz · +3 Q0.7 — _Open sheen/air the SMOOTHING lowpass removed_
  - **tilt** @ pivot ~1kHz · +1 top / -1 bottom — _Brighten overall toward the hi-fi melodic aesthetic_
- **Notes:** Mid/Side (planned) will eventually let you push the air shelf on Sides only for extra width; for now the rot/zoom motion supplies the movement.

### Drop Tamer  `[eq-only-bank]`
- **Style:** Melodic/deep-dubstep drop-bus glue + dynamic taming
- **Goal:** Drop onto any dense drop or heavy bass bus to keep it LOUD but polished — clamps harsh/resonant/splash peaks dynamically without dulling the sound between hits.
- **EQ bands:**
  - **bell** @ low-mid 250Hz · -2 Q1.0 — _Static mud control_
  - **bell** @ low 60-80Hz · 0 (dynamic) Q0.9 · dyn: downward, thr -12dB, ratio 3:1, range -5dB, fast attack — _Sub leveller so low blooms don't clip the master_
  - **bell** @ high-mid 2.5kHz · 0 (dynamic) Q1.5 · dyn: downward, thr -18dB, ratio 4:1, range -6dB, fast attack ~3ms — _Tame harsh screech peaks_
  - **bell** @ high-mid 3.8kHz · 0 (dynamic) Q1.5 · dyn: downward, thr -18dB, ratio 4:1, range -6dB, fast attack — _Tame upper presence harshness_
  - **notch** @ presence 6-8kHz · 0 (dynamic) Q8.0 · dyn: downward, thr -18dB, range -8dB, very fast attack — _De-ess / catch cymbal-clash splash_
  - **high-shelf** @ air 12kHz · +1.5 Q0.7 — _Final polish sheen_
- **Notes:** This bank IS the 'dynamic taming of the drop energy' archetype. Use MIX to blend the whole taming in parallel (~70-100% wet) and OUT trim to make up gain.

### Air & Sheen Polish  `[eq-only-bank]`
- **Style:** LEVITY polished high-end / master + lead/pad sheen
- **Goal:** Layerable 'expensive top-end' bank for leads, pads, vocals or master — adds air and brightness while dynamically catching only the harsh spikes.
- **EQ bands:**
  - **high-shelf** @ air 10-12kHz · +3 Q0.7 — _Open, silky air_
  - **bell** @ presence 8kHz · +1.5 Q1.0 — _Sparkle/definition_
  - **bell** @ high-mid 5kHz · 0 (dynamic) Q2.0 · dyn: downward, thr -20dB, range -3dB, fast attack — _Tame harsh only when it spikes so the air stays smooth_
  - **tilt** @ pivot ~700Hz · +1 top — _Gentle overall brighten_
- **Notes:** Pairs on top of Aurora Pad Bed or any 465 lead. Keep the dynamic 5 kHz band's range small (-3 dB) — this is polish, not correction.

### Clean Sub Isolator  `[eq-only-bank]`
- **Style:** Deep-dubstep clean sub-shelf, droppable onto any bass
- **Goal:** Instantly fence and level ANY bass layer into a clean, mono, controlled sub without touching the synth patch — the 'clean sub shelf' archetype as a bank.
- **EQ bands:**
  - **low-cut** @ infrasonic 22Hz · Qslope 24 dB/oct — _Strip sub-audible rumble_
  - **low-shelf** @ sub 45Hz · +4 Q0.7 — _Fundamental weight_
  - **bell** @ sub 70Hz · 0 (dynamic) Q1.0 · dyn: downward, thr -12dB, ratio 3:1, range -4dB, fast attack — _Sub leveller for consistent low end_
  - **high-cut** @ low 110Hz · Qslope 24 dB/oct — _Isolate sub band; leave mids for the reese/growl layer_
- **Notes:** On the 465 this bank is what makes a buzzy generator usable as a sub — the high-cut removes the metallic harmonics the synth can't help producing. Keep it fully mono.


---

## EQ-Type Taxonomy → Synth Band Configs

> This facet is the backbone that turns artist research into concrete band presets: it enumerates the 14 DISTINCT MOVE-TYPES a producer reaches for on an EQ, and gives each an exact configuration on OsciSynth's 12-band dynamic EQ (bell / low-high shelf / low-high cut w-slope / notch / band-pass / tilt; per-band Freq, Q, Gain, Range, Threshold, Attack, Release, Ratio; bidirectional up/down dynamics with per-band frequency-selective detection; MIX + OUT globals; planned Mid/Side). Because Type 465 is an FM/additive X-Y OSCILLOSCOPE synth (audio L/R = beam X/Y coordinates), its raw tone is harmonically dense, buzzy, metallic and drone-like: the FOLD DRIVE wavefolder throws off screaming high partials, xHarm/yHarm/zHarm ratios create INHARMONIC ringing that morph/rotation moves around in real time, and JITTER adds noise. That makes the DYNAMIC families (resonance suppressor, de-harsher, mud control) the load-bearing types here, not an afterthought — a static notch dulls the patch, but a frequency-selective downward band only ducks when the partial actually screams (the per-band ghost shows exactly this travel). Every technique below notes which sibling facets/styles reach for it, its filter type(s), frequency zone(s), gain/Q, and dynamic mode/threshold/ratio/range. Presets ship in two kinds the plan already defines: (a) COMBINED patches = synth params + their EQ, and (b) layerable EQ-ONLY banks that drop a band set onto any sound — the resonance-suppressor and telephone banks are the flagship droppable examples.

**EQ techniques (this style):**

- **Corrective HP/LP cleanup (band-edge filters)** — The base-layer move nearly every facet uses (drone, techno-bass, lo-fi, cinematic, ambient): strip sub-rumble/DC below the fundamental and shave ultrasonic buzz above the useful band before any tone-shaping. On Type 465 this matters more than on a normal synth because when the geometry drifts off-center the beam-coordinate output creates DC-ish offset and rail-hugging sub energy, and the wavefolder generates real ultrasonic partials that alias/fizz.
  - _On the synth:_ Use the dedicated LOW-END slot as a low-cut, 12-24 dB/oct: corner 24-35 Hz on drone patches (preserve the baseFreq fundamental) or 80-120 Hz on leads/plucks. Use the HIGH-END slot as a high-cut, 12 dB/oct, corner 16-19 kHz to kill wavefolder fizz. Normally static; optionally make the low-cut dynamic-UP so its slope steepens (range +6 dB) only when off-center sub energy crosses threshold (-24 dB).
- **Surgical notch (inharmonic screamer killer)** — The classic narrow-Q hunt-and-kill for a single ringing partial. Reached for by IDM/glitch, metallic-percussion, and any hyperstar/torus/cube patch facet where xHarm/yHarm/zHarm ratios lock onto one nasty inharmonic 'ping' that a broad move can't touch without dulling the whole patch.
  - _On the synth:_ Bell or notch type, Q 12-30, gain -9 to -18 dB; use band-pass listen/solo to sweep 1.5-7 kHz and find the offender. Prefer dynamic-DOWN (thr -24 dB, ratio 4:1, range -8 dB, attack 3 ms, release 120 ms) so it only clamps when that partial rings out on morph/rotation moves — leaving the patch full when it isn't.
- **Broad tonal shelf (weight / warmth balance)** — Big-picture tone in one move: low-shelf warmth to thicken thin lissajous/spiro tones, or a high-shelf pulled DOWN to de-glare the buzzy generators. Used by warm-pad/ambient and lo-fi facets to add body, and by cinematic/dark facets to civilize the top.
  - _On the synth:_ Low-shelf 150-250 Hz, +2 to +5 dB, wide Q ~0.5 for body under drones; OR high-shelf 4-6 kHz, -3 to -6 dB to tame overall buzz. Mostly static; the high-shelf can be dynamic-DOWN (thr -18 dB, ratio 2:1, range -4 dB) to duck brightness only on loud FOLD DRIVE transients.
- **Presence bell (cut-through / definition)** — Broad upper-mid bell for articulation so a lead reads on small speakers and phones. Used by lead/topline, techno-stab, and hyperstar-pluck facets.
  - _On the synth:_ Bell 2.5-4 kHz, +2 to +5 dB, Q 0.8-1.5. For a lead, make it dynamic-UP so presence lifts ONLY when the note sustains (thr -20 dB, ratio 2:1, range +3 dB, slow attack 30 ms, release 200 ms) — keeps transients from getting spiky while sustains bloom forward.
- **Air shelf (sheen / luxury top)** — High-shelf up top for air without touching the body — the polish move for ambient, pop-synth-lead, and pad facets. On this synth it must be paired with a de-harsher so the lift doesn't amplify wavefolder fizz into hiss.
  - _On the synth:_ High-shelf 12 kHz, +2 to +4 dB (12 kHz+ deliberately sits above the 4-10 kHz harsh zone). If FOLD DRIVE is high, add a companion dynamic-DOWN de-harsh bell at 6-8 kHz (Q 3, thr -20 dB, ratio 4:1, range -5 dB) so the air stays glassy, not fizzy.
- **Tilt / spectral-balance** — Tips the whole spectrum brighter or darker around a pivot while preserving internal tonal relationships — a one-knob 'make it sit' for these harmonically dense drones. Used by the mastering-glue facet, the drone facet, and any 'darker/warmer' or 'brighter/thinner' preset variant.
  - _On the synth:_ Tilt band, pivot 700 Hz-1 kHz. Tilt -2 to -4 dB to darken the buzzy top and lift weight (the common direction for Type 465), or +2 dB to brighten a thin lissajous. Static, placed last before OUT trim; blend depth with global MIX.
- **Resonance suppressor (Soothe-style multi-band dynamic)** — A rack of several dynamic-DOWN bands that each duck ONLY when their frequency rings, tracking the constantly-shifting resonances as morph/rotation/drawSpd move the partials around in real time. This is the single most important type for Type 465 and the flagship droppable EQ-only bank. Used by drone, evolving-pad, and lorenz/mobius/torus texture facets.
  - _On the synth:_ 3-5 bells spread 1.5-9 kHz, Q 6-10, static gain 0 dB, each dynamic-DOWN: thr -26 dB, ratio 3-4:1, range -6 dB, fast attack 2 ms, release 80-150 ms. The per-band ghost shows each band dipping only on its own resonance. Set frequencies by soloing and sweeping the live patch through a full morph cycle so you catch every screamer.
- **Dynamic de-esser / de-harsher** — One or two dynamic bands that clamp harsh 2-5 kHz 'digital' glare only when it spikes — the FM-synth equivalent of de-essing (the ear is most sensitive at 3-4 kHz). Effectively MANDATORY whenever FOLD DRIVE is up. Used by lead, aggressive-bass, and metallic-pluck facets.
  - _On the synth:_ Bell at 3-4 kHz, Q 2-4, dynamic-DOWN, thr -20 dB, ratio 4:1, range -6 dB, attack 1 ms (fast enough to catch the fold transient), release 60-120 ms. Add a second at 6.5 kHz (Q 3) for the true sibilant-like fizz on heavily folded patches.
- **Dynamic mud control** — A wide low-mid band that cuts ONLY when 200-400 Hz boxiness builds — keeps drone warmth in sparse sections but clears mud when layers stack or the chorus hits. Used by drone-layer, ambient-bed, and bass facets.
  - _On the synth:_ Bell 200-350 Hz, Q 0.8-1.2, dynamic-DOWN, thr set for ~-4 to -6 dB peak reduction feel (approx thr -10 dB), ratio 2:1, attack 3 ms, release 150 ms, range -4 dB. Static warmth is untouched; only the peaks get reined in — exactly the verse-warm/chorus-clear behavior.
- **Formant / vowel filter bank** — 2-3 fixed bell boosts at vowel formant frequencies turn a buzz-source into a talking/vowel timbre — a natural fit because the oscilloscope generators ARE literally a buzz source (as in classic formant synthesis, a buzz through 2-3 formant filters = a vowel). Used by vocal-synth, 'talking pad', and morph-vowel FX facets.
  - _On the synth:_ For 'ah': bells at 700 / 1220 / 2600 Hz, +6 to +10 dB, Q 4-6 (bandwidths ~130/70/160 Hz). For 'ee': 300 / 2300 / 3000 Hz; for 'oo': 300 / 870 / 2410 Hz. Isolate with band-edge low-cut 120 Hz + high-cut 8 kHz so only the formants speak. Automate/morph-link the band Freqs to sweep vowel-to-vowel for a talkbox effect.
- **Mid/Side split EQ** — (Uses the planned M/S placement) Keep the low fundamental mono and centered while pushing air onto the sides for width — especially relevant here because L/R = X/Y beam already decorrelates the channels when the geometry is wide. Used by wide-pad, ambient, and stereo-lead facets.
  - _On the synth:_ On SIDE: high-pass (low-cut) at 120 Hz to keep sub mono/tight, plus high-shelf +2 dB at 10 kHz for width. On MID: presence bell 3 kHz +2 dB for center focus. Author now as a 'wide' EQ-only bank with the M/S toggle pre-armed so it lights up when the Mid/Side capability ships.
- **Character / analog-color EQ (Pultec-style)** — Simultaneous low-shelf BOOST plus a slightly-higher broad CUT to get punchy, focused low end with a gentle scoop above the boost (the Pultec trick clears low-mid mud without killing warmth). Used by bass, kick-drone, and mix-glue facets.
  - _On the synth:_ Emulate with two static bands: low-shelf +3 dB at 60 Hz AND a bell -3 dB at 150-200 Hz (Q 0.7). Optionally add a broad +1 dB high-shelf at 12 kHz for the 'sheen', and push OUT trim to compensate. Great on cube/torus sub-drones that need to be big but tight.
- **Telephone / band-pass FX** — Strip everything outside ~300 Hz-3.4 kHz for a lo-fi/broadcast/'inside-the-machine' version of the patch — ideal for intros and transitions with these geometric tones. Used by lo-fi, transition-FX, and cinematic-radio facets. A flagship droppable EQ-only bank.
  - _On the synth:_ Either one band-pass band centered ~1 kHz (medium Q), OR low-cut 12 dB/oct at 300 Hz + high-cut 12 dB/oct at 3.4 kHz. Add 2-3 narrow +4 dB resonant bells between 600 Hz-3 kHz (Q 8-12) for the 'cheap speaker' honk. Automate global MIX 100%->0% to snap back to full range on the drop.
- **Resonant sweep (filter-sweep FX / riser)** — A high-Q band-pass or peaking band swept across the spectrum for build-ups and movement — pairs with the synth's own rotX/Y/Z + zoom motion for phosphor-synced risers. Used by riser/transition, build-up, and psy/techno facets.
  - _On the synth:_ Band-pass, Q 8-15, automate Freq 200 Hz->8 kHz over a bar (sync the sweep to fmRate/drawSpd); or a +12 dB peaking bell at high Q for a near-self-resonating scream. Not dynamic itself, but add a dynamic-DOWN safety notch parked at the top of the sweep (8-9 kHz, range -10 dB) so the peak can't over-scream into the limiter.

**Presets (7):**

### Rezz Void Drone  `[combined-patch]`
- **Style:** Rezz-style hypnotic droning mid
- **Goal:** A mid-forward, tunsettling drone that stays clean and readable under a four-on-the-floor kick — warmth kept in the sparse intro, mud and glare auto-clamped when the beat drops.
- **Synth patch:** lorenz (strange-attractor) generator; baseFreq ~55 Hz drone; slow drawSpd; moderate xHarm/yHarm for inharmonic buzz, zHarm low; slow morph; fmRate slow + low fmDepth for a queasy wobble; FOLD DRIVE moderate; SMOOTHING medium; JITTER low.
- **EQ bands:**
  - **low-cut** @ sub 30Hz · Q12dB/oct — _kill off-center DC/rumble, keep the 55Hz fundamental_
  - **bell** @ low-mid 250Hz · 0 static / -4 dynamic Q1.0 · dyn: downward, thr -10dB, ratio 2:1, range -4dB, attack 3ms, release 150ms — _dynamic mud control - clear boxiness only when layers stack_
  - **bell** @ presence 3kHz · +3 Q1.2 — _push the drone forward so it reads on phones_
  - **bell** @ harsh 4kHz · 0 static / -6 dynamic Q3 · dyn: downward, thr -20dB, ratio 4:1, range -6dB, attack 1ms, release 90ms — _de-harsh the wavefolder glare when it spikes_
  - **high-cut** @ top 18kHz · Q12dB/oct — _remove ultrasonic fold fizz_
- **Notes:** The archetype for the whole library: static warmth + presence, dynamic mud + de-harsh. Sits squarely in the Rezz mid pocket. Ship the EQ half separately as a 'Rezz Mid Tamer' eq-only bank.

### Soothe-Scope De-Harsh Bank  `[eq-only-bank]`
- **Style:** oeksound Soothe-style dynamic resonance suppressor
- **Goal:** A layerable band set you drop onto ANY harsh Type 465 generator patch to tame ringing inharmonic partials without dulling the tone — the flagship droppable bank.
- **EQ bands:**
  - **bell** @ upper-mid 2kHz · 0 static Q7 · dyn: downward, thr -26dB, ratio 3:1, range -6dB, attack 2ms, release 120ms — _duck resonance only when it rings_
  - **bell** @ harsh 3.5kHz · 0 static Q8 · dyn: downward, thr -26dB, ratio 4:1, range -6dB, attack 2ms, release 100ms — _clamp the 3-4kHz ear-sensitivity peak_
  - **bell** @ harsh 5.5kHz · 0 static Q8 · dyn: downward, thr -24dB, ratio 4:1, range -6dB, attack 2ms, release 90ms — _tame folded metallic screamers_
  - **bell** @ presence-air 8kHz · 0 static Q7 · dyn: downward, thr -22dB, ratio 3:1, range -5dB, attack 1ms, release 80ms — _control fizz before it hits the air shelf_
  - **high-shelf** @ air 12kHz · +2 Q0.7 — _add glassy sheen once fizz is controlled_
- **Notes:** Set each band's Freq by soloing the target patch and sweeping through a full morph cycle to catch every ring. The per-band ghost should show four independent dips that never all fire at once. Pairs with any lissajous/hyperstar/torus lead.

### Talkbox Butterfly (Vowel Morph)  `[combined-patch]`
- **Style:** Formant/vocoder vocal-synth (talkbox / Imogen Heap flavor)
- **Goal:** Turn the buzz-source geometry into a vowel-morphing 'talking' lead that sweeps ah->ee under a mod source.
- **Synth patch:** butterfly generator; drawSpd mid; xHarm/yHarm near-harmonic ratios for a rich buzz source; FOLD DRIVE low-moderate; morph automated as the vowel driver; SMOOTHING low to keep formants crisp.
- **EQ bands:**
  - **low-cut** @ low 120Hz · Q12dB/oct — _isolate the formant region, remove drone weight_
  - **bell** @ low-mid 700Hz · +8 Q5 — _formant F1 (ah)_
  - **bell** @ mid 1220Hz · +8 Q6 — _formant F2 (ah)_
  - **bell** @ upper-mid 2600Hz · +7 Q5 — _formant F3 (ah)_
  - **high-cut** @ top 8kHz · Q12dB/oct — _cap the buzz so vowels read cleanly_
- **Notes:** Automate the three formant Freqs together toward ee (300/2300/3000 Hz) or oo (300/870/2410 Hz) to sweep vowels. Narrow the Q toward 8 for a robotic tone. Keep the EQ static - the movement is the point.

### PSTN Transmission (Telephone)  `[eq-only-bank]`
- **Style:** Lo-fi telephone/broadcast transition FX
- **Goal:** Instantly collapse any patch into a 300Hz-3.4kHz landline-radio version for intros and pre-drop transitions, then snap back to full range.
- **EQ bands:**
  - **low-cut** @ low-mid 300Hz · Q12dB/oct — _PSTN band lower edge_
  - **bell** @ low-mid 900Hz · +4 Q10 — _cheap-speaker resonant honk_
  - **bell** @ mid 1800Hz · +4 Q9 — _second honk resonance for character_
  - **high-cut** @ upper-mid 3.4kHz · Q12dB/oct — _PSTN band upper edge_
- **Notes:** Automate global MIX 100%->0% across the bar to open from telephone back to full-range on the drop. For a grittier flavor bump the two resonant bells to Q 12 / +6 dB. Drops onto any generator.

### Pultec Sub-Anchor  `[eq-only-bank]`
- **Style:** Analog-color / Pultec low-end trick
- **Goal:** Make a cube/torus sub-drone big AND tight - shelf weight in, mud scooped just above, plus a whisper of analog sheen.
- **EQ bands:**
  - **low-shelf** @ sub 60Hz · +3 Q0.7 — _Pultec boost - add weight_
  - **bell** @ low-mid 180Hz · -3 Q0.7 — _Pultec-trick scoop - clear mud above the boost_
  - **high-shelf** @ air 12kHz · +1 Q0.6 — _subtle even-harmonic-style sheen_
  - **low-cut** @ sub 25Hz · Q12dB/oct — _clean the rumble under the shelf_
- **Notes:** The boost/scoop pairing is the Pultec magic - both centered low but the cut sits slightly higher and broader, giving punch with a gentle scoop. Compensate level with OUT trim. Also works as the mix-glue bank on the full OsciSynth bus.

### Phosphor Riser Sweep  `[combined-patch]`
- **Style:** EDM/psy build-up riser (tempo-synced resonant sweep)
- **Goal:** A tempo-locked riser where the EQ band-pass sweep is visually and sonically married to the beam's rotation/zoom motion.
- **Synth patch:** spiro generator; rising drawSpd across the bar; rotZ automated for spin; zoom increasing for intensity; FOLD DRIVE rising into the peak; JITTER creeping up for tension; baseFreq mid.
- **EQ bands:**
  - **band-pass** @ swept 200Hz->8kHz · Q12 — _resonant riser sweep, automated over one bar_
  - **bell** @ top 8.5kHz · 0 static Q6 · dyn: downward, thr -14dB, ratio 6:1, range -10dB, attack 1ms, release 60ms — _dynamic safety notch so the sweep peak can't over-scream_
  - **low-cut** @ sub 40Hz · Q12dB/oct — _keep the riser out of the sub_
- **Notes:** Sync the band-pass Freq automation to fmRate/drawSpd so the sweep rate tightens with the visual spin. The dynamic safety notch is the difference between a musical riser and a limiter-slamming scream.

### Tilt Glue Master  `[eq-only-bank]`
- **Style:** Mastering-glue / one-move darken-or-brighten on the OsciSynth bus
- **Goal:** A single spectral-tilt move to make any harmonically-dense Type 465 patch 'sit', preserving internal tonal relationships while taming the buzzy top.
- **EQ bands:**
  - **tilt** @ pivot 900Hz · -2.5 tilt — _darken the buzzy top / lift weight while keeping tonal balance_
  - **bell** @ harsh 4kHz · 0 static Q3 · dyn: downward, thr -18dB, ratio 3:1, range -4dB, attack 2ms, release 100ms — _catch any residual glare the tilt leaves_
  - **low-cut** @ sub 25Hz · Q12dB/oct — _clean subsonic before the limiter_
- **Notes:** Flip the tilt to +2 dB to brighten a thin lissajous instead. Blend depth with global MIX. This is the last-in-chain bus bank - keep it minimal so it stays transparent glue.


---

## Advanced Spectral (Vowel / Formant / Mid-Side / Tilt)

> OsciSynth's osc-FM/X-Y generators are harmonically DENSE by nature (per-axis xHarm/yHarm/zHarm stacks, a global fmRate/fmDepth vibrato, and a FOLD DRIVE wavefolder that manufactures a comb of high odd harmonics), so the EQ's job is mostly SHAPE + TAME, not manufacture. Because real energy already lives at nearly every frequency, static bell boosts actually work (no exciter needed — unlike a sine, there is always a partial to lift), and formant bells always have harmonics to excite. What to TAME: the fold-drive "ice-pick" comb around 3/6/9 kHz, aliasing shimmer above 12 kHz when xHarm/yHarm ratios push partials past Nyquist, low-mid drone mud at 200–400 Hz from baseFreq, and MOVING resonances (Lorenz attractor, morph sweeps, fmRate) that a static notch cannot follow. What to BOOST: fundamental body at baseFreq (~80–120 Hz low-shelf), presence "bite" at 3–5 kHz, an air shelf at 12 kHz+ that is genuinely liftable because fold drive populates it, and formant clusters for vocal character. The load-bearing rule: because content shifts with morph/fmRate/attractor, DYNAMIC (downward, frequency-selective) bands beat static cuts everywhere, and the single most instrument-specific fact is that output L=X and R=Y, so Mid = X+Y (beam energy along the diagonal) and Side = X−Y (the figure's 2-D openness) — mid/side EQ here literally reshapes the traced geometry, not a conventional stereo field. Mid/Side placement is a PLANNED capability, so M/S presets ship with a full-band fallback.

**EQ techniques (this style):**

- **Formant / vowel EQ (F1/F2/F3 bell clusters)** — Imposes vocal-tract resonances by boosting 2–3 narrow bells at a vowel's formant frequencies so any tone reads as a sung vowel; sweeping a source parameter through the FIXED bells animates vowel-to-vowel motion like a talkbox, with no automation of the EQ itself.
  - _On the synth:_ Use bands 1–3 as bells. Classic male formant table (Hz): A/ah 800·1150·2800, E/eh 400·1600·2700, I/ee 350·2000·2800, O/oh 450·800·2830, U/oo 325·700·2530. Example AH: B1 bell 800 Hz Q4 +8 dB, B2 bell 1150 Hz Q6 +7 dB, B3 bell 2800 Hz Q8 +5 dB, plus low-cut 80 Hz so F1 leads. Because the osc-FM source is harmonically dense (xHarm/yHarm stacks + fold drive), every formant bell always has partials to grab — turning the synth MORPH or xHarm knob drags harmonics through the static formants and produces genuine talkbox vowel movement. A brighter 'smaller head' voice = raise all three formants ~15%.
- **Resonance suppression (dynamic narrow cuts)** — A narrow bell in downward-dynamic mode that sits flat until a specific resonance crosses threshold, then clamps only that frequency — kills ringing/ice-pick without dulling the whole band. Frequency-selective detection means only the offending partial triggers it.
  - _On the synth:_ FOLD DRIVE and high xHarm ratios create an ice-pick comb at ~3/6/9 kHz that spikes with morph and fmDepth. Stack 2–3 downward dynamic bells: e.g. bell 6.3 kHz, Q10, Gain 0, Range −8 dB, Threshold −24 dB, Ratio 4:1, Attack 3 ms (fast, catches the fold buzz transient), Release 80 ms — repeated at 3.2 kHz and 9 kHz to follow the comb. The sub/drone stays untouched because detection is frequency-selective. Increase Range as FOLD DRIVE rises.
- **Tilt EQ & spectral-balance targeting** — A single tilt filter pivots the whole spectrum around a center frequency to warm or brighten in one gesture, used to hit a target slope — pink noise reads flat at ~3 dB/oct, while modern productions sit closer to the perceptual ~4.5 dB/oct downward slope.
  - _On the synth:_ The osc-FM drone almost always reads HOT up top (fold + high harmonics), so the default move is a Warm tilt: one band set to TILT, pivot ~650 Hz, −2.5 dB (down toward highs) to bring the metallic top back to a ~4.5 dB/oct target. Thin single-line generators (helix, spiro) that lack top instead take a Bright tilt: pivot ~1 kHz, +2 dB. Keep it to one gentle band; verify against a pink/4.5 dB reference curve.
- **Mid/Side 'beam' EQ (mono low, wide high)** — Places EQ on the Mid vs Side signal to keep lows centered and mono-solid while opening the highs wide — the standard 'mono bass, wide air' spectral-balance move.
  - _On the synth:_ CRITICAL and unique: output L=X, R=Y, so Mid = X+Y (energy along the X=Y diagonal) and Side = X−Y (how far the figure opens off the diagonal into 2-D). A high-cut/low-shelf on the SIDE below ~120 Hz collapses the low band onto the diagonal → rock-solid mono sub, the traced figure narrows to a thin line down low. A high-shelf +3 dB at ~9–12 kHz on the SIDE pushes the HF beam OFF the diagonal → the Lissajous/torus figure blooms wide and 2-D at the top = air/width. Mid bell +2 dB at ~90 Hz adds center weight. M/S is a PLANNED capability — until it ships, approximate with a full-band low-cut at 30 Hz plus an air shelf, and reduce stereo-inducing fold-drive/rot motion for the sub.
- **Harmonic / character EQ** — Broad, musical boosts (shelves + wide bells) that flatter the source's own harmonics — presence bite, air sheen, low-end body — the opposite of surgical cutting.
  - _On the synth:_ Because the generator MAKES rich harmonics, no exciter is needed and EQ boosts genuinely work (energy exists to lift). A wide +3 dB bell at 3–5 kHz (Q~1.2) brings out the metallic edge of cube/hyperstar/superformula geometry; a +3 dB high-shelf at 12 kHz adds sheen and is liftable precisely because fold drive populated that region (a clean sine would have nothing to raise); a +2 dB low-shelf at ~120 Hz around baseFreq gives the drone weight. Always pair a character boost with a downward dynamic safety band so the boosted region never turns to ice-pick on peaks.
- **Dynamic unmasking** — A band that ducks (downward, low ratio) only when a competing element is present, carving a frequency pocket so a lead/vocal sits above a dense drone — via frequency-selective self-detection now, or sidechain detection when available — while keeping full body when the competitor rests.
  - _On the synth:_ The dense osc-FM drone masks leads at 1–4 kHz and muddies at 300–500 Hz. Pocket bands: bell 2.5 kHz, Q2, Range −4 dB, Threshold −30 dB, Ratio 3:1, Attack 10 ms, Release 200 ms (downward), plus bell 400 Hz, Q2, Range −3 dB, Threshold −32 dB, Ratio 3:1. Because osc-FM content moves with morph/fmRate, a STATIC cut over-carves and thins the pad — the dynamic band only opens the pocket when the lead is actually there. Wire the vocal/lead bus to sidechain detection once M/S+sidechain lands; until then self-detection on the band's own energy already opens usefully.

**Presets (8):**

### Vox Machina — AH→EE Talkbeam  `[combined-patch]`
- **Style:** Daft Punk / Zapp talkbox, Rezz vocal-drone
- **Goal:** A droning oscilloscope tone that literally speaks vowels as you turn MORPH — a robotic talkbox with no vocoder and no automation on the EQ.
- **Synth patch:** Lissajous generator; baseFreq ~110 Hz drone; xHarm 3 / yHarm 2 for dense partials; FOLD DRIVE ~30% for talkbox rasp; fmRate ~5 Hz / low fmDepth for vibrato; SMOOTHING moderate. The MORPH knob sweeps harmonics through the fixed formant bells to make the vowel move.
- **EQ bands:**
  - **low-cut** @ sub/low 80Hz · Q12 dB/oct — _Remove rumble so the vowel's F1 dominates_
  - **bell** @ low-mid 800Hz · +8 Q4 — _AH first formant (F1) — jaw-open body_
  - **bell** @ mid 1150Hz · +7 Q6 — _AH second formant (F2) — vowel identity_
  - **bell** @ upper-mid 2800Hz · +5 Q8 — _AH third formant (F3) / presence for intelligibility_
  - **bell** @ presence 7kHz · 0 Q10 · dyn: downward, thr -24dB, ratio 4:1, range -6dB, attack 4ms, release 90ms — _Dynamically clamp fold-drive ice-pick so the vowel stays smooth_
- **Notes:** Author a second snapshot with EE bells (350/2000/2800 Hz) and A/B or macro-morph between them; the formants stay FIXED while the synth's MORPH drags harmonics through them, so the vowel change is free. Same rack works on any generator.

### Five Vowels Rack — EE default  `[eq-only-bank]`
- **Style:** Formant-filter / talkbox layer
- **Goal:** Drop a sung-vowel character onto ANY patch; ships bright EE, with the full A/E/I/O/U table in notes.
- **EQ bands:**
  - **low-cut** @ low 100Hz · Q12 dB/oct — _Clear rumble so F1 reads_
  - **bell** @ low-mid 350Hz · +6 Q5 — _EE first formant (F1)_
  - **bell** @ upper-mid 2000Hz · +8 Q7 — _EE second formant (F2) — the bright 'eee'_
  - **bell** @ presence 2800Hz · +5 Q9 — _EE third formant (F3) / clarity_
  - **high-shelf** @ air 10kHz · +2 Q0.7 — _Sheen on top of the vowel_
- **Notes:** Vowel table (F1·F2·F3 Hz): A 800·1150·2800, E 400·1600·2700, I 350·2000·2800, O 450·800·2830, U 325·700·2530. Raise all three ~15% for a smaller/brighter voice. Because OsciSynth is harmonically dense, the bells always have partials to excite even on a bare drone.

### Ice-Pick Tamer  `[eq-only-bank]`
- **Style:** Harsh-FM / metal high-mid taming (FabFilter spectral-dynamics style)
- **Goal:** Kill wavefolder and high-harmonic screech dynamically — transparent when the sound is clean, clamps only on the harsh peaks.
- **EQ bands:**
  - **bell** @ low-treble 3.2kHz · 0 Q9 · dyn: downward, thr -26dB, ratio 4:1, range -7dB, attack 4ms, release 90ms — _Tame first fold-drive comb tooth_
  - **bell** @ treble 6.3kHz · 0 Q10 · dyn: downward, thr -24dB, ratio 4:1, range -8dB, attack 3ms, release 80ms — _Tame the main ice-pick tooth_
  - **bell** @ high-treble 9kHz · 0 Q12 · dyn: downward, thr -22dB, ratio 5:1, range -6dB, attack 2ms, release 70ms — _Tame the top comb tooth_
  - **high-shelf** @ air 14kHz+ · 0 Q0.7 · dyn: downward, thr -20dB, ratio 3:1, range -4dB, attack 5ms, release 120ms — _Duck JITTER hiss / aliasing shimmer above 12k_
- **Notes:** Band spacing tracks the odd-harmonic comb of FOLD DRIVE; push each Range further as FOLD DRIVE increases. Leave gain at 0 so it is invisible until the source actually spikes.

### Lorenz Ghost-Notch  `[combined-patch]`
- **Style:** Autechre / Ben Frost strange-attractor drone
- **Goal:** A chaotic wandering drone whose random screaming resonances are auto-suppressed as they MOVE across the spectrum — the poster child for spectral dynamics on this synth.
- **Synth patch:** Lorenz (strange-attractor) generator; slow drawSpd; baseFreq ~55 Hz; high zHarm for chaos; low JITTER; SMOOTHING moderate; slow rotY for spatial drift.
- **EQ bands:**
  - **low-cut** @ sub 30Hz · Q12 dB/oct — _Clear DC/rumble from the attractor's slow excursions_
  - **bell** @ mid 2.5kHz · 0 Q1.5 · dyn: downward, thr -28dB, ratio 3:1, range -8dB, attack 8ms, release 150ms — _WIDE dynamic catch of the wandering resonance wherever it pokes up_
  - **bell** @ treble 5kHz · 0 Q6 · dyn: downward, thr -24dB, ratio 4:1, range -7dB, attack 4ms, release 100ms — _Second, narrower catch for the harsh upper excursions_
  - **tilt** @ pivot 800Hz · -2 — _Overall de-harsh toward a ~4.5 dB/oct target_
- **Notes:** A static notch fails here because the resonance never sits still — the wide dynamic band triggers on whatever partial exceeds threshold as the attractor wanders, which is exactly the spectral-dynamics use case.

### Pink-Slope Tilt (Warm / Bright)  `[eq-only-bank]`
- **Style:** Mastering tonal-balance / spectrum-slope targeting
- **Goal:** Nudge any osc-FM patch toward a ~4.5 dB/oct perceptual balance in a single gesture.
- **EQ bands:**
  - **tilt** @ pivot 650Hz · -2.5 — _WARM default — pull the metallic osc-FM top down to target (osc-FM usually reads hot up top)_
  - **tilt** @ pivot 1kHz · +2 — _BRIGHT variant — add slope/air to thin single-line generators (helix, spiro)_
- **Notes:** Ship as two snapshots. Reference against pink noise (flat at ~3 dB/oct) or a 4.5 dB/oct target curve. Warm is the sensible default for buzzy fold-driven patches; Bright rescues geometry that lacks upper content.

### Beam-Mono Sub / Halo Wide  `[eq-only-bank]`
- **Style:** Modern EDM master-bus width (mono bass, wide air)
- **Goal:** Rock-solid mono low-beam plus a wide, airy top — mono-compatible width.
- **EQ bands:**
  - **low-cut** @ low 120Hz (SIDE) · Q24 dB/oct — _Collapse the low band onto the X=Y diagonal → mono sub; the traced figure narrows to a line down low_
  - **high-shelf** @ air 9kHz (SIDE) · +3 Q0.7 — _Push the HF beam OFF the diagonal → the figure blooms wide/2-D at the top = air & width_
  - **bell** @ low 90Hz (MID) · +2 Q1 — _Center weight in the mono sub_
  - **high-cut** @ ultrasonic 20kHz · Q12 dB/oct — _Trim aliasing fizz above the useful band_
- **Notes:** Depends on the PLANNED Mid/Side placement. On OsciSynth Mid=X+Y, Side=X−Y, so these bands literally reshape beam geometry (thin diagonal line in the sub, open figure up top). Fallback until M/S ships: full-band low-cut 30 Hz + air shelf, and dial back stereo-inducing FOLD/rot motion in the sub so the low beam stays centered.

### Vocal Pocket Unmask  `[eq-only-bank]`
- **Style:** Pop / EDM lead-vocal ducking (dynamic-EQ unmasking)
- **Goal:** Let a lead vocal or lead synth sit on top of the drone without turning the pad down — the pad stays full when the lead rests.
- **EQ bands:**
  - **bell** @ upper-mid 2.5kHz · 0 Q2 · dyn: downward, thr -30dB, ratio 3:1, range -4dB, attack 10ms, release 200ms — _Duck the presence pocket where the vocal lives_
  - **bell** @ low-mid 400Hz · 0 Q2 · dyn: downward, thr -32dB, ratio 3:1, range -3dB, attack 15ms, release 250ms — _Clear low-mid mud masking the vocal body_
- **Notes:** Wire the vocal/lead bus to sidechain detection when that capability lands; until then the band's frequency-selective self-detection still opens usefully on the drone's own peaks. Dynamic (not static) is essential because osc-FM content shifts with MORPH/fmRate — a static cut would permanently thin the pad.

### Metallic Bloom Character  `[combined-patch]`
- **Style:** Jean-Michel Jarre metallic bell-pad / modern superformula lead
- **Goal:** A big, shiny, characterful metallic pad that bites and sparkles but never crosses into harsh.
- **Synth patch:** super (bloom / superformula) generator; MORPH mid; xHarm 4 / yHarm 3; FOLD DRIVE ~25%; fmRate ~6 Hz slow; zoom up for size; SMOOTHING low-mid.
- **EQ bands:**
  - **low-shelf** @ low 120Hz · +2 Q0.7 — _Body/weight around baseFreq_
  - **bell** @ presence 4kHz · +3 Q1.2 — _Metallic bite — boosting harmonics that genuinely exist (character EQ, not exciter)_
  - **high-shelf** @ air 12kHz · +3 Q0.7 — _Sheen — liftable because FOLD DRIVE populated the top_
  - **bell** @ treble 7kHz · 0 Q10 · dyn: downward, thr -22dB, ratio 4:1, range -6dB, attack 3ms, release 80ms — _Safety tamer so the presence/air boosts never ice-pick on peaks_
- **Notes:** The pro combo is a static character BOOST for constant shine plus a downward DYNAMIC safety cut that only engages on peaks — you get the flattering tone without the harsh transients the wavefolder would otherwise throw.


---

# Codex-5.4 cross-check A — EDM / bass-music (gpt-5.4 @ high)

```
These suggestions are mapped to the actual synth controls `baseFreq`, `drawSpd`, `xHarm/yHarm/zHarm`, `morph`, `fmRate/fmDepth`, `drive`, `smooth`, `jitter`, plus the 10 generators (`lissajous` through `lorenz`) in [OsciSynth Type 465.dc.html](/mnt/c/Users/alexb/Desktop/Dev Stuff/SYNTH/OsciSynth Type 465/OsciSynth Type 465.dc.html:141), [OsciSynth Type 465.dc.html](/mnt/c/Users/alexb/Desktop/Dev Stuff/SYNTH/OsciSynth Type 465/OsciSynth Type 465.dc.html:202), and the FM-on-draw-frequency behavior in [OsciSynth Type 465.dc.html](/mnt/c/Users/alexb/Desktop/Dev Stuff/SYNTH/OsciSynth Type 465/OsciSynth Type 465.dc.html:296). The EQ assumptions match the planned per-band dynamic detector, `Range/Threshold/Ratio/Attack/Release`, and global `MIX/OUT` in [OSCISYNTH_PLUGIN_ROADMAP.md](/mnt/c/Users/alexb/Desktop/Dev Stuff/SYNTH/OsciSynth Type 465/OSCISYNTH_PLUGIN_ROADMAP.md:82).

**EDM Fundamentals**
- This synth is naturally buzzy/metallic, so factory EQ should mostly do 4 jobs: control sub excess below 30-40 Hz, shape the “vowel” midrange at 300 Hz-3.5 kHz, dynamically suppress narrow pain points at 2.5-8 kHz, and set top-end brightness with shelves rather than brute-force boost.
- Default bass-music safety chain: `HP 25-30 Hz 24 dB/oct`, `Bell -2 to -4 dB @ 250-350 Hz Q 1-1.4`, `dynamic notch -2 to -6 dB @ strongest harsh peak 3-7 kHz Q 6-14`, `HS +1 to +3 dB @ 8-12 kHz` only if `smooth` is already above ~0.2.

**Skrillex**
- Character: aggressive talking mids, tight low-end, lots of moving formants, and surgical control of harshness so the patch can be brutally bright without turning white-noise.
- EQ moves: formant pair with alternating boosts/cuts around `450-900 Hz` and `1.4-2.8 kHz`; narrow dynamic notches at `3.8-6.5 kHz`; low-mid cleanup around `220-350 Hz`; slight upper-tilt from `7 kHz+`.
- `Cinema Snarl` (combined patch): `hyperstar`, `baseFreq 45`, `drawSpd 1.3`, `x/y/z 3.0/5.0/1.0`, `morph 0.72`, `fmRate 5.2`, `fmDepth 0.10`, `drive 0.38`, `smooth 0.22`, `jitter 0.01`. EQ: `HP 28Hz 24dB`; `Bell +4@520/Q1.1`; `Bell -4@1.15k/Q3.2`; `Bell +5@2.35k/Q4.5 up T-34 R1.6 Ra3 A18 Rel140`; `Notch -4@4.9k/Q10 down T-24 R2.8 Ra5 A1 Rel80`; `HS +2@9.5k/Q0.6`.
- `Yoi Throat Split` (combined patch): `spiro`, `baseFreq 52`, `drawSpd 1.6`, `x/y/z 2.0/7.0/0.5`, `morph 0.63`, `fmRate 7.8`, `fmDepth 0.14`, `drive 0.44`, `smooth 0.18`. EQ: `HP 30Hz 24dB`; `Bell -3@280/Q1.2`; `Bell +5@760/Q2.0`; `Bell -5@1.8k/Q4.0 down T-26 R2 Ra4 A6 Rel110`; `Bell +4@2.9k/Q3.0`; `Notch -3@6.2k/Q12 down T-22 R3 Ra4 A0.8 Rel60`.
- `Brostep Control` (EQ-only): `HP 27Hz 24dB`; `Bell -2.5@330/Q1.0`; `Bell +3@680/Q1.8`; `Bell -3@1.4k/Q3`; `Bell +3@2.4k/Q3`; `Notch -4@4.4k/Q8 down T-24 R2.5 Ra4`; `Tilt +1.5 dB bright centered ~1.8k`.

**Moody Good**
- Character: dense, filthy, low-mid-forward, with grotesque texture and pressure around `150 Hz-1.5 kHz`; less “clean bright” than Skrillex, more swamp and chew.
- EQ moves: keep genuine meat at `140-240 Hz`; carve mud at `300-450 Hz`; emphasize bark at `700 Hz-1.2 kHz`; dynamic de-harsh at `3-5 kHz`; darker top via negative tilt if needed.
- `Swamp Hydraulic` (combined patch): `torus`, `baseFreq 42`, `drawSpd 0.95`, `x/y/z 1.5/3.0/1.0`, `morph 0.82`, `fmRate 2.4`, `fmDepth 0.08`, `drive 0.52`, `smooth 0.28`, `jitter 0.03`. EQ: `HP 26Hz 24dB`; `LS +2@90/Q0.7`; `Bell -3@360/Q1.3`; `Bell +4@820/Q1.8`; `Bell +2.5@1.25k/Q2.2`; `Notch -3@4.1k/Q7 down T-25 R2 Ra4 A3 Rel90`; `HS -1.5@8.5k/Q0.7`.
- `Diesel Gargle` (combined patch): `mobius`, `baseFreq 48`, `drawSpd 1.1`, `x/y/z 2.5/4.0/0.8`, `morph 0.70`, `fmRate 4.5`, `fmDepth 0.06`, `drive 0.60`, `smooth 0.25`. EQ: `HP 30Hz 24dB`; `Bell +3@180/Q1.0`; `Bell -4@420/Q1.5`; `Bell +5@980/Q2.5`; `Bell -2@2.2k/Q2`; `Notch -4@4.8k/Q10 down T-23 R2.5 Ra5 A1 Rel70`.
- `Filth Weight` (EQ-only): `HP 25Hz 24dB`; `LS +1.5@75`; `Bell -3@310/Q1.1`; `Bell +3@900/Q1.7`; `Bell +2@1.4k/Q2`; `Tilt -1 dB dark centered ~2.2k`; `Notch -2.5@4.5k/Q8 down`.

**Flume**
- Character: soft-transient but hyper-detailed, airy, intentionally skewed spectra, pretty-on-top / odd-in-the-middle, often with hollowed low-mids and glossy highs.
- EQ moves: remove boxiness `250-500 Hz`; wide presence lift `1.5-4 kHz`; air shelf `9-14 kHz`; dynamic clamp only on occasional metallic spikes `5-8 kHz`; broader, gentler Q than brostep.
- `Glass Bloom` (combined patch): `super`, `baseFreq 60`, `drawSpd 1.7`, `x/y/z 4.0/3.0/0.5`, `morph 0.58`, `fmRate 0.8`, `fmDepth 0.04`, `drive 0.18`, `smooth 0.42`, `jitter 0.02`. EQ: `HP 32Hz 18dB`; `Bell -3@340/Q1.0`; `Bell +2.5@2.1k/Q1.4`; `Bell +2@3.8k/Q1.6 up T-38 R1.5 Ra2.5 A25 Rel180`; `Notch -2.5@6.7k/Q9 down T-25 R2.2 Ra3 A1 Rel70`; `HS +3@11.5k/Q0.5`.
- `Hollow Neon Pad-Bass` (combined patch): `butterfly`, `baseFreq 55`, `drawSpd 0.85`, `x/y/z 1.0/2.5/0.5`, `morph 0.46`, `fmRate 0.3`, `fmDepth 0.02`, `drive 0.12`, `smooth 0.50`, `jitter 0.04`. EQ: `HP 35Hz 18dB`; `Bell -2@260/Q0.9`; `Bell -2@520/Q1.1`; `Bell +3@1.8k/Q1.2`; `HS +4@10k/Q0.5`; `Notch -2@5.8k/Q7 down`.
- `Future-Detail Polish` (EQ-only): `HP 30Hz 18dB`; `Bell -2.5@400/Q1`; `Bell +2@1.9k/Q1.3`; `Bell +1.5@3.2k/Q1.5`; `HS +2.5@12k`; `Notch -2@7k/Q8 down`.

**Rezz**
- Character: hypnotic, dark, centered, less top-end splash, more grinding midrange loops; the bass wants to feel monolithic and slightly nasal rather than huge and shiny.
- EQ moves: emphasize `120-220 Hz` and `700 Hz-1.4 kHz`; suppress fizzy air above `7-9 kHz`; use narrow de-ringing at `2.5-4.5 kHz`; low-pass or dark tilt is part of the sound.
- `Hypno Spine` (combined patch): `helix`, `baseFreq 43`, `drawSpd 0.72`, `x/y/z 1.0/2.0/1.0`, `morph 0.66`, `fmRate 1.6`, `fmDepth 0.05`, `drive 0.34`, `smooth 0.33`, `jitter 0.00`. EQ: `HP 27Hz 24dB`; `Bell +2@150/Q0.9`; `Bell -2@380/Q1.3`; `Bell +3.5@980/Q2.0`; `Notch -3@3.2k/Q8 down T-27 R2.3 Ra3 A1.5 Rel100`; `HS -2@8.2k/Q0.6`; optional `LP 14k 12dB`.
- `Dark Spiral Lead-Bass` (combined patch): `lorenz`, `baseFreq 50`, `drawSpd 0.90`, `x/y/z 1.2/2.8/0.4`, `morph 0.40`, `fmRate 2.1`, `fmDepth 0.03`, `drive 0.40`, `smooth 0.36`. EQ: `HP 30Hz 24dB`; `Bell +2.5@180/Q1.0`; `Bell -3@450/Q1.4`; `Bell +4@1.2k/Q2.3`; `Notch -2.5@4.0k/Q9 down`; `Tilt -1.5 dB dark centered ~2k`.
- `Midnight Tunnel` (EQ-only): `HP 28Hz`; `Bell +2@170`; `Bell -2.5@350/Q1.2`; `Bell +3@1k/Q2`; `Notch -3@3.6k/Q8 down`; `HS -2@9k`.

**Levity**
- Character: festival-forward, punchy, bright, emotional, with clean sub support and animated upper-mid bite; more open and crowd-readable than the darker bass styles.
- EQ moves: sub discipline below `35 Hz`; snappy presence at `1.5-3 kHz`; excitement shelf `8-12 kHz`; dynamic cut on brittle `4-6 kHz`; sometimes a smile curve with dipped `300-500 Hz`.
- `Festival Bloom Bass` (combined patch): `lissajous`, `baseFreq 47`, `drawSpd 1.25`, `x/y/z 2.0/3.0/1.0`, `morph 0.54`, `fmRate 3.8`, `fmDepth 0.07`, `drive 0.24`, `smooth 0.26`, `jitter 0.02`. EQ: `HP 30Hz 24dB`; `Bell -2.5@380/Q1.1`; `Bell +3@1.9k/Q1.8`; `Bell +2@2.8k/Q2.0 up T-36 R1.5 Ra2.5 A12 Rel100`; `Notch -3@5.2k/Q10 down T-24 R2.5 Ra4 A1 Rel60`; `HS +2.5@9.8k/Q0.6`.
- `Skyline Growl` (combined patch): `cube`, `baseFreq 50`, `drawSpd 1.45`, `x/y/z 3.0/6.0/0.8`, `morph 0.61`, `fmRate 6.0`, `fmDepth 0.09`, `drive 0.32`, `smooth 0.22`. EQ: `HP 28Hz`; `Bell -3@320/Q1.2`; `Bell +4@850/Q1.7`; `Bell +3@2.4k/Q2.4`; `Notch -3@4.8k/Q9 down`; `HS +2@11k`.
- `Mainstage Lift` (EQ-only): `HP 28Hz 24dB`; `Bell -2@420/Q1`; `Bell +2.5@1.8k/Q1.5`; `Bell +2@3k/Q1.8`; `HS +2@10k`; `Notch -2.5@5.5k/Q8 down`.

**EQ-Type Taxonomy**
- `Sub hygiene`: `HP 25-35 Hz`, usually `24 dB/oct`; mandatory because these generators plus FM/draw-speed can spit useless infra-energy.
- `Mud carve`: `Bell -2 to -4 dB @ 250-450 Hz Q 1-1.5`; use on nearly every bass preset.
- `Vowel/formant sculpt`: paired bells like `+4 @ 500-900 Hz Q 1.5-2.5` and `-3 @ 1.2-2.0 kHz Q 2-4`, or the inverse for talking-growl movement.
- `Bark/presence focus`: `Bell +2 to +5 dB @ 1.8-3.2 kHz Q 1.5-4`; this is what makes patches read on phone speakers and in festival PA top boxes.
- `Dynamic de-harsh`: `Notch or tight Bell @ 3.5-7 kHz Q 6-14`, `down mode`, `T -28..-22`, `Ratio 2:1 to 3:1`, `Range 2-6 dB`, `Attack 0.5-5 ms`, `Release 50-120 ms`.
- `Upward detail recovery`: `Bell @ 2-4 kHz` or `HS @ 8-12 kHz`, `up mode`, `T -40..-32`, `Ratio 1.3:1-1.8:1`, `Range 1-3 dB`; use after smoothing, not before.
- `Dark/bright macro`: `Tilt` centered `1.8-2.5 kHz`, usually within `±1.5 dB`; faster than stacking shelves when preset browsing.
- `Air shelf`: `HS +1 to +4 dB @ 9-14 kHz`; only for cleaner presets with `smooth >= 0.2`, otherwise it turns fold/jitter hash into sand.
- `Pseudo mono-low until M/S exists`: keep stereo-causing fizz out of the lows by high-passing side-like brightness from the patch itself; practically, reduce `jitter`, keep `zHarm` modest, and avoid boosting above `2 kHz` if the preset’s perceived width is already high.
```

---

# Codex-5.4 cross-check B — cinematic / atmospheric (gpt-5.4 @ high)

```
Mapped to the synth control surface in [OsciSynth Type 465.dc.html:141](/mnt/c/Users/alexb/Desktop/Dev%20Stuff/SYNTH/OsciSynth%20Type%20465/OsciSynth%20Type%20465.dc.html:141), texture controls in [OsciSynth Type 465.dc.html:157](/mnt/c/Users/alexb/Desktop/Dev%20Stuff/SYNTH/OsciSynth%20Type%20465/OsciSynth%20Type%20465.dc.html:157), generator set in [OsciSynth Type 465.dc.html:169](/mnt/c/Users/alexb/Desktop/Dev%20Stuff/SYNTH/OsciSynth%20Type%20465/OsciSynth%20Type%20465.dc.html:169), and the planned dynamic-EQ band model in [OSCISYNTH_PLUGIN_ROADMAP.md:35](/mnt/c/Users/alexb/Desktop/Dev%20Stuff/SYNTH/OsciSynth%20Type%20465/OSCISYNTH_PLUGIN_ROADMAP.md:35), [OSCISYNTH_PLUGIN_ROADMAP.md:84](/mnt/c/Users/alexb/Desktop/Dev%20Stuff/SYNTH/OsciSynth%20Type%20465/OSCISYNTH_PLUGIN_ROADMAP.md:84), [OSCISYNTH_PLUGIN_ROADMAP.md:85](/mnt/c/Users/alexb/Desktop/Dev%20Stuff/SYNTH/OsciSynth%20Type%20465/OSCISYNTH_PLUGIN_ROADMAP.md:85), [OSCISYNTH_PLUGIN_ROADMAP.md:88](/mnt/c/Users/alexb/Desktop/Dev%20Stuff/SYNTH/OsciSynth%20Type%20465/OSCISYNTH_PLUGIN_ROADMAP.md:88).  
Band syntax below: `type freq Q gain | dyn dir range thr ratio atk rel`. `up` assumes the bidirectional mode from your spec; if a build is downward-only, render `up` moves as smaller static boosts plus lower `MIX`.

**1. Cinematic EQ Moves**
- `Big / expensive / wide`: `LS 55Hz Q0.7 +2 to +4`, `bell 250-450Hz Q0.8-1.4 -2 to -5`, `HS 9-12k Q0.6 +1.5 to +4`; this is the default “Hollywood bed” curve for torus/super/lissajous pads.
- `Sub power without mud`: keep true sub with `LC 22-28Hz 24/48dB`, then either `bell 45-70Hz +2 to +4` or `LS 60Hz +2`; clear room with `bell 160-320Hz -3 to -6`.
- `Low-mid trench for braaams`: `bell 300-450Hz Q1.0 -3 to -5`, sometimes a second `bell 700-1.1k -1 to -3`; makes metallic generators feel larger instead of boxier.
- `Air / halo shelf`: on smoother patches only, `HS 9-14k +2 to +4`; pair with `HC 14-18k 12dB` if the synth’s fold/jitter spits fizz.
- `Dark cinematic veil`: `HC 8-12k 12/24dB` plus `bell 2.5-4.5k -1 to -3`; essential for eerie beds and downers.
- `Dynamic de-harshing`: `bell 2.7-3.8k Q1.8-3.0 0dB | dyn dn -2 to -5 thr -30..-22 ratio 1.8:1-3:1 atk 1-10ms rel 80-220ms`; catches forward metallic bark.
- `Dynamic de-sizzle`: `bell 6.5-9k Q3-8 0dB | dyn dn -2 to -6 thr -34..-24 ratio 2:1-4:1 atk 0.5-3ms rel 40-120ms`; use on butterfly/hyperstar/cube with drive+jitter.
- `Telephone / surveillance bed`: `LC 120-220Hz`, `HC 3.5-6k`, optional `BP 900Hz-1.8k Q0.6-1.1`; strong on butterfly and lorenz for “radio room” atmospheres.
- `Formant colour / choir illusion`: two or three bells, e.g. `+2 at 700-900Hz`, `+2 at 1.1-1.5k`, `+1 at 2.2-3k`, with a dip near `350-500Hz`; works well on super/helix pads.
- `Spectral tilt`: if native tilt lands, lean `-1 to -3 dB/oct` for dark beds or `+1 to +2 dB/oct` for rising tension; if not, fake it with `LS` + opposite `HS` because the roadmap currently lists shelves/cuts/notch/BP but not tilt.
- `Movement by dynamics, not LFO`: use static sculpting plus 1-3 dynamic bands with slower releases (`250-1200ms`) so the EQ “breathes” with the synth’s own `fmRate/fmDepth`, `morph`, rotation, and `jitter`.

**2. Preset Concepts**
- `Abyss Watch` `[combined synth+EQ]`: `lorenz`; `baseFreq 43`, `drawSpd .72`, `x/y/z 1.35/2.2/.45`, `morph .78`, `fm .09/.05`, `drive .18`, `smooth .44`, `jitter .05`, slow Y/Z rotation. EQ: `LC 24Hz 24dB; LS 56Hz .7 +2.5; bell 290Hz 1.1 -3.5; notch 820Hz 7 -2; bell 2.9k 2.2 0 | dyn dn -4 -28 2.2 8 180; HC 12.5k 12dB`.
- `Cathedral Brass` `[combined]`: `torus`; `baseFreq 58`, `drawSpd .95`, `x/y/z 1/1.5/1`, `morph .82`, `fm 4.8/.07`, `drive .36`, `smooth .24`, `zoom 1.08`. EQ: `LC 28Hz 24dB; LS 72Hz +2; bell 180Hz +1.5; bell 360Hz -4; bell 1.35k +2.5; bell 3.4k 2.4 0 | dyn dn -3 -24 2.5 3 120; HS 8.5k +1`.
- `Crater Impact Tail` `[combined]`: `cube`; `baseFreq 46`, `attack .003`, `release 1.8`, `drawSpd 1.2`, `x/y/z 2.5/1/.4`, `morph .65`, `fm 7.5/.12`, `drive .58`, `smooth .12`. EQ: `LC 22Hz 48dB; LS 48Hz +4; bell 110Hz +2 | dyn up +2 -32 1.5 20 350; bell 260Hz -5; notch 2.2k 10 -3; bell 4.8k 3 0 | dyn dn -5 -26 3 1 90; HC 11k 12dB`.
- `Event Horizon Riser` `[combined]`: `helix`; start `baseFreq 92`, `drawSpd .7`, `morph .35`, `fm .4/.04`; perform by pushing `drawSpd -> 2.8`, `morph -> .95`, `fmRate -> 6`, more `zoom`. EQ: `LC 120Hz 24dB; bell 650Hz -3; bell 1.8k +2; bell 5.2k 1.4 0 | dyn up +4 -30 1.8 40 420; HS 9.5k +3; HC 15k 12dB`.
- `Halo Bloom Pad` `[combined]`: `super`; `baseFreq 74`, `drawSpd .62`, `x/y/z 4/2/.8`, `morph .34`, `fm .12/.03`, `drive .10`, `smooth .58`, tiny rotation only. EQ: `LC 32Hz 24dB; bell 220Hz -2.5; bell 520Hz -1.5; bell 2.2k 2 0 | dyn dn -2 -26 1.8 18 260; HS 10k +3.5; HC 16k 12dB`.
- `Abandoned Relay` `[combined]`: `butterfly`; `baseFreq 118`, `drawSpd 1.35`, `x/y/z 4/1.2/0`, `morph .7`, `fm 2.2/.09`, `drive .28`, `smooth .20`, `jitter .14`, moderate Z rotation. EQ: `LC 150Hz 24dB; BP 1.25k .7; bell 520Hz 1.6 -3; bell 1.1k 2 +2.5; bell 2.4k 2 +2; notch 6.8k 12 0 | dyn dn -2 -30 2 2 80`.
- `Broken Tape Fog` `[EQ-only bank]`: for lo-fi ambient beds. EQ: `LC 70Hz 24dB; LS 140Hz -2.5; bell 420Hz -3; bell 1.6k +1 | dyn up +2 -36 1.4 60 700; HS 4.8k -4; HC 6.6k 24dB`.
- `Trailer Void Smile` `[EQ-only bank]`: for “epic wide/deep” beds. EQ: `LC 30Hz 24dB; LS 58Hz +2.5; bell 250Hz -2; bell 420Hz -3.5; bell 1.1k -1.5; bell 2.8k 2.2 0 | dyn dn -3 -26 2 10 180; HS 9k +2.5; HC 15.5k 12dB`.
- `Cold Sink Downer` `[combined]`: `mobius`; start `baseFreq 140`, automate down to `55`, `drawSpd 1.8 -> .5`, `smooth .18 -> .45`, `x/y/z 1.5/.75/1.4`, `morph .62`, `fm 3.3/.06`. EQ: `LC 40Hz 24dB; bell 180Hz +1; bell 750Hz -2.5; bell 2.1k 2 0 | dyn dn -3 -28 2 12 250; HS 7k -2; HC 10.5k 12dB`.

**3. EQ-Type Taxonomy**
- `Epic Wide Bed`: `LS +`, `250-450 dip`, mild `HS +`, dynamic de-harsh at `2.5-4k`.
- `Tension Drone`: keep `45-70Hz`, cut `200-350Hz`, darken with `HC 10-13k`, add one dynamic harshness catcher.
- `Braaam / Horn Hit`: `70Hz push`, `300-450Hz trench`, `1.2-1.8k presence`, dynamic clamp at `3-4k`.
- `Impact / Drop Tail`: very low `LC`, strong `45-60Hz` boost, deep `220-320Hz` cleanup, fast dynamic control on `4-8k`.
- `Riser`: higher `LC 100-150Hz`, upper-mid build at `1.5-5k`, brighter `HS`, upward dynamic air.
- `Eerie / Surveillance`: `BP` or `LC+HC` narrow window, formant bells around `1k-2.5k`, deep dark top.
- `Lo-fi Ambient`: low shelf down, high shelf down, `HC 5-8k`, gentle mid scoop, slow upward dynamics in the 1-2k whisper zone.
- `Choir / Formant Pad`: two or three narrow positive bells at vowel zones, small `350-500Hz` cut, restrained air.

If Claude needs one recommendation distilled to a default factory “cinematic smart curve,” use `LC 28Hz`, `LS 60Hz +2`, `bell 320Hz -3.5`, `bell 2.9k dyn dn -3.5`, `HS 10k +2`, `HC 15k`, `MIX 70-85%`.
```
