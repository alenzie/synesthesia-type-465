// Phase-1 browser pass via Playwright headless Chromium.
// Verifies: app mounts from file://, AudioWorklet path engages (blob addModule), audio flows,
// beam telemetry arrives, notes work, EQ interaction + undo, FAUST download, forced-SPN fallback.
const { chromium } = require('playwright-core');

const URL = 'file:///mnt/c/Users/alexb/Desktop/Dev%20Stuff/SYNTH/OsciSynth%20Type%20465/OsciSynth%20Type%20465.dc.html';
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  — ' + detail : '')); };

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage({ acceptDownloads: true });
  const pageErrors = [], consoleMsgs = [];
  page.on('pageerror', e => pageErrors.push(String(e.message).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') consoleMsgs.push(m.type() + ': ' + m.text().slice(0, 160)); });

  await page.goto(URL);
  await page.waitForFunction(() => window.__osci && window.__osci.core, { timeout: 45000 });
  check('T1 app mounts from file:// (dc-runtime + React CDN + SynthCore)', true);

  // T2: power on -> worklet path
  await page.evaluate(() => window.__osci.power(true));
  await page.waitForFunction(() => window.__osci.running, { timeout: 15000 });
  const audioState = await page.evaluate(() => ({ usingWorklet: window.__osci._usingWorklet, dead: !!window.__osci._workletDead, ctx: window.__osci.ctx.state, sr: window.__osci.ctx.sampleRate }));
  check('T2 W0 spike: AudioWorklet engages via blob addModule on file://', audioState.usingWorklet === true, JSON.stringify(audioState));

  // T3: audio flows (drone is on by default) — meters accumulate via telemetry
  await page.waitForTimeout(1200);
  const flow1 = await page.evaluate(() => ({ sqN: window.__osci.core.outSqN, rw: window.__osci.rw, meter: window.__osci.meterVal }));
  await page.waitForTimeout(800);
  const flow2 = await page.evaluate(() => ({ sqN: window.__osci.core.outSqN, rw: window.__osci.rw, meter: window.__osci.meterVal }));
  check('T3a audio renders (RMS accumulator advancing)', flow2.sqN !== flow1.sqN || flow2.meter > 0, `meter=${flow2.meter.toFixed(4)}`);
  check('T3b beam chunks arrive (RAF ring advancing = transferable pool round-trip)', flow2.rw !== flow1.rw, `rw ${flow1.rw} -> ${flow2.rw}`);
  const nonSilent = await page.evaluate(() => { let s = 0; const r = window.__osci.ringX; for (let i = 0; i < r.length; i++) s += Math.abs(r[i]); return s; });
  check('T3c beam is non-silent', nonSilent > 0, 'sum|x|=' + nonSilent.toFixed(2));

  // T4: note on -> voice telemetry mirrors back; note off
  await page.evaluate(() => { window.__osci.noteOn(64, 0.9, true); });
  await page.waitForTimeout(400);
  const voice = await page.evaluate(() => { const v = window.__osci.voices.find(v => v.note === 64); return v ? { env: v.env, gate: v.gate } : null; });
  check('T4 note round-trip (params-before-note; voice env via telemetry)', !!voice && voice.env > 0.01, JSON.stringify(voice));
  await page.evaluate(() => window.__osci.noteOff(64));

  // T5: analyzer + EQ interaction + undo (band add is one undo step)
  const eq = await page.evaluate(() => {
    const o = window.__osci;
    o.setState({ scopeMode: 'analyzer' });
    const before = o.eqBands.length, undoBefore = o.undoStack.length;
    o._eqAdd(1500, -4);
    const after = o.eqBands.length, undoAfter = o.undoStack.length;
    o.undo();
    return { before, after, undone: o.eqBands.length, undoBefore, undoAfter };
  });
  check('T5 EQ band add + single undo step + undo restores', eq.after === eq.before + 1 && eq.undoAfter === eq.undoBefore + 1 && eq.undone === eq.before, JSON.stringify(eq));
  await page.waitForTimeout(300); // let the band patch flow to the worklet
  const alive = await page.evaluate(() => window.__osci.running && window.__osci._usingWorklet && !window.__osci._workletDead);
  check('T5b worklet survives band-merge patches', alive === true);

  // T6: FAUST export produces a download with plausible content
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.evaluate(() => window.__osci.exportFaust()),
  ]);
  const dlPath = await download.path();
  const dsp = require('fs').readFileSync(dlPath, 'utf8');
  check('T6 FAUST export downloads a .dsp', download.suggestedFilename() === 'oscisynth-type-465-eq.dsp' && dsp.includes('import("stdfaust.lib");') && dsp.includes('process = eqst;'), download.suggestedFilename() + ', ' + dsp.length + ' bytes');

  // T7: forced-SPN fallback drives the same core
  await page.evaluate(async () => { const o = window.__osci; o._forceSPN = true; await o.power(false); await o.power(true); });
  await page.waitForFunction(() => window.__osci.running, { timeout: 10000 });
  await page.waitForTimeout(1000);
  const spn = await page.evaluate(() => ({ usingWorklet: window.__osci._usingWorklet, sqN: window.__osci.core.outSqN, rw: window.__osci.rw }));
  await page.waitForTimeout(600);
  const spn2 = await page.evaluate(() => ({ sqN: window.__osci.core.outSqN, rw: window.__osci.rw }));
  check('T7 forced-SPN fallback: renders + beam advances', spn.usingWorklet === false && (spn2.sqN !== spn.sqN || spn2.rw !== spn.rw), JSON.stringify({ spn, spn2 }));

  // T8: restore worklet path after un-forcing (power cycle)
  await page.evaluate(async () => { const o = window.__osci; o._forceSPN = false; await o.power(false); await o.power(true); });
  await page.waitForTimeout(600);
  const back = await page.evaluate(() => window.__osci._usingWorklet);
  check('T8 worklet path restored after fallback (power cycle)', back === true);

  // T9: clean power off
  await page.evaluate(() => window.__osci.power(false));
  await page.waitForTimeout(300);
  const off = await page.evaluate(() => ({ running: window.__osci.running, ctx: window.__osci.ctx.state }));
  check('T9 power off (ctx suspended)', off.running === false && off.ctx === 'suspended', JSON.stringify(off));

  // T10: no page errors; report console noise
  check('T10 zero uncaught page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
  if (consoleMsgs.length) console.log('console noise (info only):\n  ' + consoleMsgs.slice(0, 8).join('\n  '));

  await browser.close();
  const fails = results.filter(r => !r.ok).length;
  console.log(fails === 0 ? '\nBROWSER PASS: ALL ' + results.length + ' CHECKS GREEN' : '\n' + fails + ' CHECKS FAILED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e.message); process.exit(2); });
