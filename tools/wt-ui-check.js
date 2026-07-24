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
    await p.setInputFiles('input[type=file][accept*=".wt"]', FIX('clm-4x2048-int16.wav'));
    await p.waitForFunction(() => window.__osci._wtInfo || window.__osci._wtErr, { timeout: 30000 });
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
    await p.setInputFiles('input[type=file][accept*=".wt"]', FIX('stereo-xy-4x2048.wav'));
    await p.waitForFunction(() => window.__osci._wtInfo && window.__osci._wtInfo.channels === 2, { timeout: 30000 });
    const st = await p.evaluate(() => ({ ch: window.__osci.core.wtActive().channels, hasR: !!window.__osci.core.wtActive().levels[0].R }));
    ok('stereo X/Y table imports with both channels', st.ch === 2 && st.hasR);

    // Surge .wt
    await p.setInputFiles('input[type=file][accept*=".wt"]', FIX('surge-4x512-int16.wt'));
    await p.waitForFunction(() => window.__osci._wtInfo && window.__osci._wtInfo.frameSize === 512, { timeout: 30000 });
    ok('Surge .wt imports', await p.evaluate(() => window.__osci.core.wtActive().frameSize === 512));

    // a corrupt file must show readable text, not throw, and must not change the active table
    const before = await p.evaluate(() => window.__osci.core.wtHash);
    await p.setInputFiles('input[type=file][accept*=".wt"]', FIX('corrupt.wav'));
    await p.waitForFunction(() => window.__osci._wtErr, { timeout: 20000 });
    const bad = await p.evaluate(() => ({ err: window.__osci._wtErr, hash: window.__osci.core.wtHash }));
    ok('corrupt file reports a readable error', /fmt|RIFF|short/i.test(bad.err), bad.err);
    ok('a failed import leaves the previous table active', bad.hash === before);

    // ambiguous frame size -> chooser offered
    await p.setInputFiles('input[type=file][accept*=".wt"]', FIX('noclm-2x2048.wav'));
    await p.waitForTimeout(1500);
    const amb = await p.evaluate(() => ({ pending: !!window.__osci._wtPending, info: window.__osci._wtInfo }));
    ok('no-clm file either resolves or offers a frame-size chooser', amb.pending || !!amb.info,
       amb.pending ? 'chooser offered' : 'resolved to ' + amb.info.frameSize);

    await p.evaluate(() => window.__osci.power(false));
    await b.close();
  }
  console.log(fail === 0 ? '\nWAVETABLE UI: ALL CHECKS GREEN' : '\n' + fail + ' CHECKS FAILED');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e.message); process.exit(2); });
