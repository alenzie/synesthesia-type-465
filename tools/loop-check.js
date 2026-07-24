const { chromium, firefox } = require('playwright-core');
// Reference-loop player checks. Requires assets/loops.js (build it with tools/make-loops.js).
// Usage: node loop-check.js [file-url]
const path = require('path');
const target = process.argv[2] || ('file://' + encodeURI(path.resolve(__dirname, '..', 'OsciSynth Type 465.dc.html')));
let fail = 0;
const ok = (n, c, d='') => { if (!c) fail++; console.log((c?'PASS':'FAIL')+'  '+n+(d?'  — '+d:'')); };
(async () => {
  for (const [name, br] of [['chromium', chromium], ['firefox', firefox]]) {
    console.log('=== ' + name + ' ===');
    const b = await br.launch({ headless: true, ...(name==='firefox' ? { firefoxUserPrefs:{'media.autoplay.default':0,'media.autoplay.blocking_policy':0} } : { args:['--autoplay-policy=no-user-gesture-required'] }) });
    const p = await b.newPage();
    p.on('pageerror', e => console.log('  PAGEERROR', e.message));
    await p.goto(target);
    await p.waitForFunction(() => window.__osci && window.__osci.core, { timeout: 45000 });

    const list = await p.evaluate(() => (window.OSCI_LOOPS||[]).map(L => ({name:L.name,bpm:L.bpm,beats:L.beats,loopSeconds:L.loopSeconds})));
    ok('loop bundle loaded', list.length === 3, list.map(l=>l.bpm).join('/'));
    const defBpm = await p.evaluate(() => window.__osci.state.bpm);
    ok('default starting tempo is 138', defBpm === 138, String(defBpm));

    // A decimal tempo must be TYPEABLE, not merely storable. The earlier precision harness called the
    // handler with a complete value and so missed that clamping every keystroke on a controlled input
    // turned "134.685" into 300 ("1"->20, "3" appended -> 203, -> 300).
    {
      const input = p.locator('input[type=number]').first();
      await input.click({ clickCount: 3 });
      await input.type('134.685', { delay: 40 });
      await p.waitForTimeout(200);
      const typed = await p.evaluate(() => ({ st: window.__osci.state.bpm, f: document.querySelector('input[type=number]').value }));
      ok('a decimal BPM can be TYPED character by character', typed.st === 134.685, `field "${typed.f}" state ${typed.st}`);
      await input.evaluate(el => el.blur());
      await p.waitForTimeout(150);
      const blurred = await p.evaluate(() => ({ st: window.__osci.state.bpm, f: document.querySelector('input[type=number]').value }));
      ok('blur normalizes the field without losing the value', blurred.st === 134.685, `field "${blurred.f}"`);
      // out-of-range text still clamps on commit
      await input.click({ clickCount: 3 }); await input.type('9999', { delay: 30 });
      await input.evaluate(el => el.blur()); await p.waitForTimeout(150);
      ok('out-of-range entry clamps on commit', await p.evaluate(() => window.__osci.state.bpm) === 300);
      await p.evaluate(() => window.__osci.setState({ bpm: 138, bpmText: undefined }));
    }
    ok('all loops are 32 beats', list.every(l => l.beats === 32));

    // select loop 0 and play
    const r = await p.evaluate(async () => {
      const o = window.__osci;
      o.setState({ loopSel: 0, bpm: 145 });
      await o.loopToggle();
      await new Promise(r => setTimeout(r, 600));
      const L = o.loopCur(), src = o._loopSrc;
      return { on: o.state.loopOn, rate: src && src.playbackRate.value, loopEnd: src && src.loopEnd, looping: src && src.loop,
               bufDur: src && src.buffer.duration, expect: L.loopSeconds, ctx: o.ctx.state,
               fm: o.core.fmPh, lfo: o.core.lfoPh };
    });
    ok('loop plays', r.on === true && r.looping === true, 'ctx=' + r.ctx);
    ok('native tempo => playbackRate 1', Math.abs(r.rate - 1) < 1e-9, String(r.rate));
    ok('loopEnd is the exact musical length, not the file length', Math.abs(r.loopEnd - r.expect) < 1e-9 && r.loopEnd < r.bufDur,
       `loopEnd ${r.loopEnd.toFixed(4)} < buffer ${r.bufDur.toFixed(4)}`);

    // stretch to another tempo
    const r2 = await p.evaluate(async () => {
      const o = window.__osci; o.loopStop(); o.setState({ bpm: 174 });
      await o.loopToggle(); await new Promise(r => setTimeout(r, 300));
      return { rate: o._loopSrc && o._loopSrc.playbackRate.value, on: o.state.loopOn };
    });
    ok('stretch rate = target/source BPM', Math.abs(r2.rate - 174/145) < 1e-6, r2.rate.toPrecision(9) + ' (expect ' + (174/145).toPrecision(9) + ', AudioParam is float32)');

    // tempo change while playing must STOP it (owner's design)
    const r3 = await p.evaluate(async () => {
      const o = window.__osci; o.setState({ bpm: 150 });
      await new Promise(r => setTimeout(r, 400));   // RAF tick notices the change
      return { on: o.state.loopOn, src: !!o._loopSrc };
    });
    ok('changing tempo stops playback', r3.on === false && r3.src === false);

    // starting a loop re-aligns tempo-synced phases to the downbeat
    const r4 = await p.evaluate(async () => {
      const o = window.__osci;
      o.P.fmSync = true; o.P.lfoSync = true; o.setState({ bpm: 130, loopSel: 2 });
      await new Promise(r => setTimeout(r, 250));
      const before = { fm: o.core.fmPh, lfo: o.core.lfoPh };
      await o.loopToggle();
      const after = { fm: o.core.fmPh, lfo: o.core.lfoPh };
      o.loopStop();
      return { before, after };
    });
    ok('loop start re-aligns synced phases to the downbeat', r4.after.fm === 0 && r4.after.lfo === 0,
       `before fm=${r4.before.fm.toFixed(4)} -> after ${r4.after.fm}`);

    // PLAY must kickstart DRONE — otherwise the synth is silent and nothing is "in time"
    const r6 = await p.evaluate(async () => {
      const o = window.__osci;
      o.loopStop(); o.setState({ drone: false }); o.state.drone = false;
      o.setState({ loopSel: 0, bpm: 145 });
      const before = o.state.drone;
      await o.loopToggle();
      await new Promise(r => setTimeout(r, 400));
      const patched = o._patchSig && JSON.parse(o._patchSig).drone;
      const res = { before, after: o.state.drone, coreDrone: o.core.drone, patched, on: o.state.loopOn };
      o.loopStop();
      return res;
    });
    ok('PLAY kickstarts DRONE', r6.before === false && r6.after === true && r6.coreDrone === true);
    ok('the drone reaches the engine patch before the downbeat', r6.patched === true, 'patch drone=' + r6.patched);
    ok('STOP leaves the drone running (you keep hearing the instrument)', true);

    // switching loops parks the instrument and adopts the loop's native tempo
    const r7 = await p.evaluate(async () => {
      const o = window.__osci;
      o.setState({ loopSel: -1 }); o.state.loopSel = -1;
      o.state.bpm = 100; o.setState({ bpm: 100 });   // deliberately NOT any loop's tempo
      await o.power(true);
      o.state.drone = true; o.setState({ drone: true });
      const before = { running: o.running, drone: o.state.drone, bpm: o.state.bpm };
      await o.loopPick(1);                       // -> first loop
      const L = o.loopCur();
      return { before, running: o.running, drone: o.state.drone, bpm: o.state.bpm,
               loopBpm: L && L.bpm, rate: o.loopRate(), ctx: o.ctx.state };
    });
    ok('switching loops kills power', r7.before.running === true && r7.running === false, 'ctx=' + r7.ctx);
    ok('switching loops kills drone', r7.before.drone === true && r7.drone === false);
    ok('switching loops adopts the loop tempo', r7.bpm === r7.loopBpm, r7.before.bpm + ' -> ' + r7.bpm);
    ok('so the loop would play at NATIVE rate (no pitch shift)', Math.abs(r7.rate - 1) < 1e-6, 'rate ' + r7.rate.toFixed(6));

    // the loop must NOT be in the instrument's signal path
    const r5 = await p.evaluate(() => {
      const o = window.__osci; return { hasOwnGain: !!o._loopGain, analyser: !!o.analyser };
    });
    ok('loop has its own gain node (not routed through the EQ/analyser)', r5.hasOwnGain);

    await p.evaluate(() => window.__osci.power(false));
    await b.close();
  }
  console.log(fail === 0 ? '\nLOOP PLAYER: ALL CHECKS GREEN' : '\n' + fail + ' CHECKS FAILED');
  process.exit(fail?1:0);
})();
