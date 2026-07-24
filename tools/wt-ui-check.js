// C5 UI: import a real fixture through the REAL file input in real browsers, and prove the table
// reaches the audio path. Requires tools/fixtures (built by make-wavetable-fixtures.js).
// Usage: node wt-ui-check.js [file-url] [--chromium|--firefox]
const { chromium, firefox } = require('playwright-core');
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
execFileSync(process.execPath, [path.join(__dirname, 'make-wavetable-fixtures.js')], { stdio: 'ignore' });
const only = process.argv.includes('--firefox') ? 'firefox' : (process.argv.includes('--chromium') ? 'chromium' : null);
const ENGINES = only ? [only] : ['chromium', 'firefox'];
const target = (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null)
  || ('file://' + encodeURI(path.resolve(__dirname, '..', 'OsciSynth Type 465.dc.html')));
const FIX = (n) => path.join(__dirname, 'fixtures', n);
// Import and wait on the engine's monotonic completion marker (cached + stored + SELECTED).
// Waiting on _wtInfo instead races: it is set before the store write and the selection.
async function importFixture(p, file, expectError) {
  const before = await p.evaluate(() => window.__osci._wtDone || 0);
  await p.evaluate(() => { const o = window.__osci; o._wtErr = ''; o._wtPending = null; });
  await p.setInputFiles('input[type=file][accept*=".wt"]', FIX(file));
  await p.waitForFunction(([b, wantErr]) => {
    const o = window.__osci;
    return wantErr ? !!o._wtErr : ((o._wtDone || 0) > b || !!o._wtErr || !!o._wtPending);
  }, [before, !!expectError], { timeout: 40000 });
}
let fail = 0;
const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS' : 'FAIL') + '  ' + n + (d ? '  — ' + d : '')); };

(async () => {
  for (const name of ENGINES) {
    console.log('=== ' + name + ' ===');
    const br = name === 'firefox' ? firefox : chromium;
    const b = await br.launch({ headless: true, ...(name === 'firefox'
      ? { firefoxUserPrefs: { 'media.autoplay.default': 0, 'media.autoplay.blocking_policy': 0 } }
      : { args: ['--autoplay-policy=no-user-gesture-required'] }) });
    const p = await b.newPage();
    p.on('pageerror', e => console.log('  PAGEERROR', e.message));
    await p.goto(target);
    await p.waitForFunction(() => window.__osci && window.__osci.core, { timeout: 45000 });

    // select the wavetable generator -> the row must appear
    await p.evaluate(() => window.__osci.setState({ gen: 'wavetable' }));
    await p.waitForTimeout(200);
    ok('LOAD TABLE button appears for the wavetable generator', await p.locator('text=LOAD TABLE').count() > 0);
    ok('frame strip canvas is present', await p.evaluate(() => !!window.__osci._refs.wtStripRef));

    // import a MONO clm fixture through the real input
    await importFixture(p, 'clm-4x2048-int16.wav');
    const r = await p.evaluate(() => {
      const o = window.__osci;
      return { info: o._wtInfo, err: o._wtErr, hash: o.core.wtHash, cached: !!o.core.wtCache[o.core.wtHash],
               frames: o.core.wtActive().frames, frameSize: o.core.wtActive().frameSize,
               levels: o.core.wtActive().levels.length, isBuiltin: o.core.wtHash === o.core.WT_BUILTIN };
    });
    ok('mono import succeeds', !r.err && !!r.info, r.err || `${r.info.frames}x${r.info.frameSize} ${r.info.source}`);
    ok('imported table becomes the ACTIVE table (not the built-in)', r.isBuiltin === false && r.cached);
    ok('imported geometry is right', r.frames === 4 && r.frameSize === 2048 && r.levels === 9);

    // it must actually reach the audio path
    const snd = await p.evaluate(async () => {
      const o = window.__osci;
      await o.power(true);
      o.state.drone = true; o.setState({ drone: true }); o.P.morph = 0.5;
      await new Promise(r => setTimeout(r, 700));
      return { peak: o.meterVal, running: o.running, usingWorklet: o._usingWorklet };
    });
    ok('imported table produces audio', snd.peak > 0.001, 'meter ' + snd.peak.toFixed(4) + (snd.usingWorklet ? ' (worklet)' : ' (spn)'));

    // stereo import -> X/Y table
    await p.evaluate(() => { window.__osci._wtInfo = null; });
    await p.setInputFiles('input[type=file][accept*=".wt"]', FIX('stereo-xy-4x2048.wav'));
    await p.waitForFunction(() => { const i = window.__osci._wtInfo; return i && i.channels === 2; }, { timeout: 30000 });
    const st = await p.evaluate(() => ({ ch: window.__osci.core.wtActive().channels, hasR: !!window.__osci.core.wtActive().levels[0].R }));
    ok('stereo X/Y table imports with both channels', st.ch === 2 && st.hasR);

    // Surge .wt
    await p.evaluate(() => { window.__osci._wtInfo = null; });
    await p.setInputFiles('input[type=file][accept*=".wt"]', FIX('surge-4x512-int16.wt'));
    await p.waitForFunction(() => { const i = window.__osci._wtInfo; return i && i.frameSize === 512; }, { timeout: 30000 });
    ok('Surge .wt imports', await p.evaluate(() => window.__osci.core.wtActive().frameSize === 512));

    // a corrupt file must show readable text, not throw, and must not change the active table
    const before = await p.evaluate(() => window.__osci.core.wtHash);
    await importFixture(p, 'corrupt.wav');
    const bad = await p.evaluate(() => ({ err: window.__osci._wtErr, hash: window.__osci.core.wtHash }));
    ok('corrupt file reports a readable error', /fmt|RIFF|short/i.test(bad.err), bad.err);
    ok('a failed import leaves the previous table active', bad.hash === before);

    // ambiguous frame size -> chooser offered
    await importFixture(p, 'noclm-2x2048.wav');
    await p.waitForTimeout(300);
    const amb = await p.evaluate(() => ({ pending: !!window.__osci._wtPending, info: window.__osci._wtInfo }));
    ok('no-clm file either resolves or offers a frame-size chooser', amb.pending || !!amb.info,
       amb.pending ? 'chooser offered' : 'resolved to ' + amb.info.frameSize);

    // ---- C4: storage + preset references ----
    // Clear the marker FIRST: waiting on a predicate the previous fixture already satisfies
    // (2x2048 also has frameSize 2048) returns instantly and reads stale state.
    await p.evaluate(() => { window.__osci._wtInfo = null; window.__osci._wtPending = null; window.__osci._wtErr = ''; });
    await p.setInputFiles('input[type=file][accept*=".wt"]', FIX('clm-4x2048-int16.wav'));
    await p.waitForFunction(() => { const i = window.__osci._wtInfo; return i && i.frames === 4 && i.frameSize === 2048; }, { timeout: 30000 });
    const store = await p.evaluate(async () => {
      const o = window.__osci;
      const st = await o.wtStore();
      const rec = await st.get(o.core.wtHash);
      return { mode: st.mode, saved: !!rec, note: o._wtStoreNote || '',
               samples: rec ? (rec.samplesL && rec.samplesL.length) : 0, frames: rec && rec.frames };
    });
    ok('storage probe resolves to a working backend', store.mode === 'indexeddb' || store.mode === 'memory', store.mode + (store.note ? ' — ' + store.note : ''));
    ok('imported table is persisted to the store', store.saved && store.samples === 4 * 2048 && store.frames === 4, `${store.samples} samples`);

    // preset save carries a REFERENCE (hash), never the samples
    const ref = await p.evaluate(() => {
      const o = window.__osci;
      o.savePreset('wt-test');
      const pr = o.banks.user[o.banks.user.length - 1];
      return { has: !!pr.wavetable, hash: pr.wavetable && pr.wavetable.hash, live: o.core.wtHash,
               bytes: JSON.stringify(pr).length, keys: pr.wavetable && Object.keys(pr.wavetable) };
    });
    ok('preset carries a wavetable reference', ref.has && ref.hash === ref.live, ref.keys && ref.keys.join(','));
    ok('preset does NOT inline the samples', ref.bytes < 20000, ref.bytes + ' bytes');

    // switch to the built-in, then reload the preset -> the table must come back from the store
    const recall = await p.evaluate(async () => {
      const o = window.__osci;
      const want = o.core.wtHash;
      o.core.wtCache = {}; o.core.wtOrder = [];
      o.core.wtCache[o.core.WT_BUILTIN] = o.core._wtMakeBuiltin();   // wipe the cache: force a store read
      o.core.wtHash = o.core.WT_BUILTIN;
      const pr = o.banks.user[o.banks.user.length - 1];
      o.applyPreset(pr);
      for (let i = 0; i < 100 && o.core.wtHash !== want; i++) await new Promise(r => setTimeout(r, 100));
      return { want, got: o.core.wtHash, frames: o.core.wtActive().frames, missing: o._wtMissing };
    });
    ok('loading the preset resolves the table from storage', recall.got === recall.want && recall.frames === 4, recall.missing || 'resolved');

    // a preset naming an UNKNOWN table must warn and keep playing the built-in
    const miss = await p.evaluate(async () => {
      const o = window.__osci;
      const pr = JSON.parse(JSON.stringify(o.banks.user[o.banks.user.length - 1]));
      pr.wavetable.hash = 'sha256:definitely-not-stored'; pr.wavetable.name = 'Ghost Table';
      o.applyPreset(pr);
      for (let i = 0; i < 60 && !o._wtMissing; i++) await new Promise(r => setTimeout(r, 100));
      return { missing: o._wtMissing, hash: o.core.wtHash, builtin: o.core.WT_BUILTIN,
               renders: o.core.wtActive() === o.core.wtCache[o.core.WT_BUILTIN] };
    });
    ok('missing table warns by name', /Ghost Table/.test(miss.missing || ''), miss.missing);
    ok('missing table falls back to the built-in, never silence', miss.renders === true);

    await p.evaluate(() => window.__osci.power(false));
    await b.close();
  }
  console.log(fail === 0 ? '\nWAVETABLE UI: ALL CHECKS GREEN' : '\n' + fail + ' CHECKS FAILED');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e.message); process.exit(2); });
