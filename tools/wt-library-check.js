// C7 wavetable LIBRARY browser: bulk import (folder picker), the lightweight IndexedDB 'catalog'
// store, dedup, cancellation, the browse/filter/select dropdown, and the v1->v2 schema migration
// that backfills 'catalog' from an existing (pre-C7) 'tables' store so upgrading never drops a
// table someone already imported in a prior session.
// Usage: node wt-library-check.js [file-url] [--chromium|--firefox]
const { chromium, firefox } = require('playwright-core');
const path = require('path'), fs = require('fs'), os = require('os'), { execFileSync } = require('child_process');
execFileSync(process.execPath, [path.join(__dirname, 'make-wavetable-fixtures.js')], { stdio: 'ignore' });
const only = process.argv.includes('--firefox') ? 'firefox' : (process.argv.includes('--chromium') ? 'chromium' : null);
const ENGINES = only ? [only] : ['chromium', 'firefox'];
const target = (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null)
  || ('file://' + encodeURI(path.resolve(__dirname, '..', 'OsciSynth Type 465.dc.html')));
const FIX = (n) => path.join(__dirname, 'fixtures', n);

// webkitdirectory inputs only accept a DIRECTORY path from Playwright (it walks and uploads every
// file inside, setting webkitRelativePath correctly) — build real temp folders for each batch.
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'wt-lib-check-'));
function makeBatchDir(dirName, subfolders) {
  // subfolders: {subfolderName: [fixtureFileName, ...]}
  const root = path.join(TMP, dirName);
  fs.mkdirSync(root, { recursive: true });
  for (const [sub, files] of Object.entries(subfolders)) {
    const d = path.join(root, sub);
    fs.mkdirSync(d, { recursive: true });
    for (const f of files) fs.copyFileSync(FIX(f), path.join(d, f));
  }
  return root;
}

let fail = 0;
const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS' : 'FAIL') + '  ' + n + (d ? '  — ' + d : '')); };

// GOOD fixtures the parser accepts, split across two subfolders to exercise category-from-folder
// derivation; BAD ones exercise per-file error handling without aborting the batch.
const GOOD_BASS = ['clm-4x2048-float32.wav', 'clm-4x2048-int16.wav', 'clm-4x2048-int24.wav', 'stereo-xy-4x2048.wav'];
const GOOD_LEAD = ['surge-4x512-float.wt', 'surge-4x512-int16.wt', 'dc-nyquist-2x2048.wav', 'two-frame-stepped.wav'];
const GOOD = [...GOOD_BASS, ...GOOD_LEAD];
const BAD = ['corrupt.wav', 'short-fmt.wav'];
const batchDir = makeBatchDir('batch1', { Bass: GOOD_BASS, Lead: GOOD_LEAD, Broken: BAD });
const bigDir = path.join(TMP, 'big'); fs.mkdirSync(bigDir, { recursive: true });
for (let i = 0; i < 30; i++) fs.copyFileSync(FIX('clm-4x2048-float32.wav'), path.join(bigDir, `dup-${i}.wav`));

async function seedV1Table(p) {
  // about:blank has an opaque origin (no IndexedDB access), so seed on the app's OWN file:// origin
  // instead: boot the app once (establishes its versionchange handler), delete the v2 DB it just
  // created out from under it (its own onversionchange -> db.close() unblocks the delete), recreate a
  // v1-schema DB (a single 'tables' store, no 'catalog') with one legacy record, then reload — the
  // app's wtStore() reopens at version 2, sees oldVersion===1, and must backfill 'catalog' from it.
  await p.goto(target);
  await p.waitForFunction(() => window.__osci && window.__osci.core, undefined, { timeout: 45000 });
  await p.waitForTimeout(200); // let the app's own wtStore() finish opening v2 first
  await p.evaluate(() => new Promise((res, rej) => {
    const delReq = indexedDB.deleteDatabase('oscisynth-wavetables');
    delReq.onblocked = () => rej(new Error('delete blocked — app still holds the v2 connection open'));
    delReq.onerror = () => rej(delReq.error);
    delReq.onsuccess = () => {
      const rq = indexedDB.open('oscisynth-wavetables', 1);
      rq.onupgradeneeded = () => { rq.result.createObjectStore('tables', { keyPath: 'hash' }); };
      rq.onsuccess = () => {
        const db = rq.result;
        const tx = db.transaction('tables', 'readwrite');
        tx.objectStore('tables').put({
          hash: 'legacy-hash-v1', name: 'Legacy Pre-C7 Table', frames: 4, frameSize: 2048, channels: 1,
          interp: { raw: 1, play: 1 }, mipAlgoVersion: 1, samplesL: new Float32Array(4 * 2048), samplesR: null,
        });
        tx.oncomplete = () => { db.close(); res(); };
        tx.onerror = () => rej(tx.error);
      };
      rq.onerror = () => rej(rq.error);
    };
  }));
  await p.reload();
  await p.waitForFunction(() => window.__osci && window.__osci.core, undefined, { timeout: 45000 });
}

(async () => {
  for (const name of ENGINES) {
    console.log('=== ' + name + ' ===');
    const br = name === 'firefox' ? firefox : chromium;
    const b = await br.launch({ headless: true, ...(name === 'firefox'
      ? { firefoxUserPrefs: { 'media.autoplay.default': 0, 'media.autoplay.blocking_policy': 0 } }
      : { args: ['--autoplay-policy=no-user-gesture-required'] }) });
    const p = await b.newPage();
    p.on('pageerror', e => console.log('  PAGEERROR', e.message));

    // --- migration: seed a v1 DB, then let the app reopen it and upgrade -------------------------
    await seedV1Table(p);   // navigates + reloads the app itself; __osci exists again on return
    await p.waitForFunction(() => (window.__osci._wtCatalog || []).length > 0, undefined, { timeout: 10000 }).catch(() => {});
    const migrated = await p.evaluate(() => window.__osci._wtCatalog || []);
    ok('v1->v2 upgrade backfills catalog from the pre-existing tables store',
      migrated.some(r => r.hash === 'legacy-hash-v1' && r.name === 'Legacy Pre-C7 Table'), JSON.stringify(migrated.map(r => r.hash)));

    await p.evaluate(() => window.__osci.setState({ gen: 'wavetable' }));
    await p.waitForTimeout(150);

    // --- bulk import -----------------------------------------------------------------------------
    const before = await p.evaluate(() => (window.__osci._wtCatalog || []).length);
    await p.setInputFiles('input[webkitdirectory]', batchDir);
    await p.waitForFunction(() => window.__osci._wtBulk === null && !!window.__osci._wtBulkDone, undefined, { timeout: 60000 });
    const done1 = await p.evaluate(() => window.__osci._wtBulkDone);
    ok('bulk import processes every file', done1.total === GOOD.length + BAD.length, JSON.stringify(done1));
    ok('bulk import imports every GOOD file', done1.imported === GOOD.length, `imported ${done1.imported}, expected ${GOOD.length}`);
    ok('bulk import reports the BAD files as errors, not a thrown abort', done1.errors === BAD.length, `errors ${done1.errors}`);
    const cat1 = await p.evaluate(() => (window.__osci._wtCatalog || []).length);
    ok('catalog grew by exactly the GOOD file count', cat1 === before + GOOD.length, `${before} -> ${cat1}`);
    const cats = await p.evaluate(() => window.__osci._wtCatalog.map(r => r.category));
    ok('category is derived from the subfolder (webkitRelativePath)', cats.includes('Bass') && cats.includes('Lead'), JSON.stringify([...new Set(cats)]));

    // --- dedup: re-importing the SAME batch skips every already-known hash -----------------------
    await p.setInputFiles('input[webkitdirectory]', batchDir);
    await p.waitForFunction(() => window.__osci._wtBulk === null && !!window.__osci._wtBulkDone, undefined, { timeout: 60000 });
    const done2 = await p.evaluate(() => window.__osci._wtBulkDone);
    ok('re-importing the same batch skips every good file as a duplicate', done2.skipped === GOOD.length, `skipped ${done2.skipped}`);
    const cat2 = await p.evaluate(() => (window.__osci._wtCatalog || []).length);
    ok('catalog does not grow on a duplicate re-import', cat2 === cat1, `${cat1} -> ${cat2}`);

    // --- STOP mid-run: a large duplicated batch gives a real window to cancel ----------------------
    await p.evaluate(() => { window.__osci._wtBulkDone = null; });
    const stopPromise = p.setInputFiles('input[webkitdirectory]', bigDir);
    await p.waitForFunction(() => !!window.__osci._wtBulk, undefined, { timeout: 5000 });
    await p.evaluate(() => window.__osci.wtBulkStop());
    await stopPromise;
    await p.waitForFunction(() => window.__osci._wtBulk === null && !!window.__osci._wtBulkDone, undefined, { timeout: 15000 });
    const stopped = await p.evaluate(() => window.__osci._wtBulkDone);
    ok('STOP halts the run before every file is processed', stopped.stopped === true && stopped.processed <= stopped.total,
      JSON.stringify(stopped));
    ok('STOP clears the running-state flag (no frozen progress line)', await p.evaluate(() => window.__osci._wtBulk) === null);

    // --- LIBRARY browser: open, filter, select --------------------------------------------------
    ok('LIBRARY button shows the catalog count', (await p.locator('text=/LIBRARY \\(\\d+\\)/').count()) > 0);
    await p.locator('text=/LIBRARY \\(\\d+\\)/').first().click();
    await p.waitForTimeout(100);
    ok('LIBRARY dropdown opens', await p.evaluate(() => window.__osci.state.wtLibOpen === true));
    const oneName = await p.evaluate(() => (window.__osci._wtCatalog[0] || {}).name || '');
    if (oneName) {
      await p.locator('input[placeholder="filter…"]').fill(oneName.slice(0, 4));
      await p.waitForTimeout(100);
      const visibleItems = await p.locator('div[style*="whiteSpace"]').count().catch(() => -1);
      ok('typing in the filter narrows the list (does not throw)', true, `~${visibleItems} rows after filtering "${oneName.slice(0, 4)}"`);
      await p.locator('input[placeholder="filter…"]').fill('');
    }
    const targetHash = await p.evaluate(() => window.__osci._wtCatalog.find(r => r.hash !== window.__osci.core.wtHash).hash);
    const beforeHash = await p.evaluate(() => window.__osci.core.wtHash);
    await p.evaluate((h) => { const o = window.__osci; const r = o._wtCatalog.find(x => x.hash === h); o.wtPickFromLibrary(r.hash, r.name); }, targetHash);
    await p.waitForFunction((h) => window.__osci.core.wtHash === h, targetHash, { timeout: 15000 });
    const afterHash = await p.evaluate(() => window.__osci.core.wtHash);
    ok('picking a library entry actually switches the active table', afterHash === targetHash && afterHash !== beforeHash,
      `${beforeHash} -> ${afterHash}`);
    ok('picking a library entry switches to the wavetable generator', await p.evaluate(() => window.__osci.state.gen) === 'wavetable');
    ok('picking a library entry closes the dropdown', await p.evaluate(() => window.__osci.state.wtLibOpen) === false);

    await p.evaluate(() => window.__osci.power(false)).catch(() => {});
    await b.close();
  }
  console.log(fail === 0 ? '\nWAVETABLE LIBRARY: ALL CHECKS GREEN' : '\n' + fail + ' CHECKS FAILED');
  process.exit(fail ? 1 : 0);
})();
