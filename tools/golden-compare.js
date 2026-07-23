const fs = require('fs');
let worstAll = 0, fail = 0;
for (const name of ['s1_drone_eq_post-48000','s1_drone_eq_post-44100','s2_midi_lorenz_pre-48000','s3_keys_genswap-48000']) {
  const ra = fs.readFileSync(`ref-${name}.bin`), rb = fs.readFileSync(`cand-${name}.bin`);
  const a = new Float32Array(ra.buffer, ra.byteOffset, ra.byteLength / 4);
  const b = new Float32Array(rb.buffer, rb.byteOffset, rb.byteLength / 4);
  if (a.length !== b.length) { console.log(name, 'LENGTH MISMATCH'); fail++; continue; }
  let worst = 0, worstIdx = -1, exact = 0;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d > worst) { worst = d; worstIdx = i; } if (a[i] === b[i]) exact++; }
  const ok = worst < 1e-6;
  if (!ok) fail++;
  if (worst > worstAll) worstAll = worst;
  console.log(name, 'max-abs', worst.toExponential(2), 'at', worstIdx, 'exact-match', (100*exact/a.length).toFixed(2)+'%', ok?'OK':'FAIL');
}
console.log(fail === 0 ? 'GOLDEN EQUIVALENCE OK (worst '+worstAll.toExponential(2)+')' : fail+' SCENARIOS FAIL');
process.exit(fail?1:0);
