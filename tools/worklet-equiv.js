// Headless AudioWorklet-path verification:
//  1. Build the REAL worklet module source via Component._workletModuleSrc().
//  2. Run it in a fake AudioWorkletGlobalScope; drive the REAL message protocol.
//  3. Same scenario through the SPN path (Component.process 2048-blocks) must be bit-identical.
//  4. Beam chunks must reassemble to the same beam stream; pool must drop (not grow) when starved.
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const m = html.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
class DCLogic { constructor(){ this.state={}; this._refs={}; } setState(s){ Object.assign(this.state,s); } }
global.window={SYNESTHESIA_BANKS:{}}; global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
const Component = new Function('DCLogic', m[1] + '\nreturn Component;')(DCLogic);
const lcg=(seed)=>{ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; };

// --- shared scenario ---
const SR=48000, TOT=2048*24;
function setup(c){
  c.ctx={sampleRate:SR}; c.running=true;
  c.state.drone=true; c.state.gen='lorenz'; c.state.bpm=120; c.state.eqTap='pre';
  c.P.jitter=0.3; c.P.fmSync=true; c.P.morphSync=true; c.P.width=0.4;
  const dyn={on:true,mode:'down',threshDb:-30,ratio:3,rangeDb:8,attackMs:5,releaseMs:80};
  c.eqBands=c._eqNormalize([{type:'bell',freqHz:500,gainDb:4,q:2,on:true,slopeDbOct:12,muted:false,soloed:false,dyn}]);
  c.core.eqBands=c.eqBands;
}

// --- SPN reference path ---
const ref=new Component({}); setup(ref); ref.core.rng=lcg(777);
const refL=new Float32Array(TOT), refR=new Float32Array(TOT), refBeamX=new Float32Array(TOT);
{
  const N=2048;
  for(let o=0;o<TOT;o+=N){
    const L=new Float32Array(N), R=new Float32Array(N);
    ref.process({outputBuffer:{getChannelData:(ch)=>ch===0?L:R}});
    refL.set(L,o); refR.set(R,o);
    // note at block 8 boundary (divisible by 128 too)
    if(o/N===7)ref.noteOn(50,0.8,true);
  }
  // reconstruct beam from the RAF ring (rw walked TOT samples; ring is 16384 = still contains the tail)
}

// --- worklet path ---
const host=new Component({}); setup(host);
const wkSrc=host._workletModuleSrc();
const mainInbox=[];
class FakePort { constructor(){ this.onmessage=null; } postMessage(msg,tr){ mainInbox.push(msg); } }
const FakeAWP = class { constructor(){ this.port=new FakePort(); } };
let ProcessorCls=null;
new Function('sampleRate','registerProcessor','AudioWorkletProcessor', wkSrc)(SR, (n,c)=>{ProcessorCls=c;}, FakeAWP);
if(!ProcessorCls) throw new Error('registerProcessor not called');
const proc=new ProcessorCls();
proc.core.rng=lcg(777);
const send=(msg)=>proc.port.onmessage({data:msg});

// protocol: initial patch (real _patchBody), then render 128-blocks, note via message at same sample offset
host._usingWorklet=true; host.wnode={port:{postMessage:(m2)=>send(m2)}}; // route host pushes into the fake processor
host._patchSig=''; host._pushPatch(true);
const wkL=new Float32Array(TOT), wkR=new Float32Array(TOT);
const beamOut=[];
let dropCheckDone=false;
for(let o=0;o<TOT;o+=128){
  if(o===2048*8)send({t:'note',on:true,n:50,v:0.8}); // ref fires AFTER block 7 completes = before sample 16384
  const L=new Float32Array(128), R=new Float32Array(128);
  proc.process([], [[L,R]]);
  wkL.set(L,o); wkR.set(R,o);
  // main-thread side: consume beam messages, return buffers to the pool (round-trip)
  while(mainInbox.length){ const msg=mainInbox.shift(); if(msg.t==='beam'){ beamOut.push({x:msg.x.slice(0),y:msg.y.slice(0)}); send({t:'pool',x:msg.x,y:msg.y}); } }
}

// compare audio
let worst=0; for(let i=0;i<TOT;i++){ worst=Math.max(worst,Math.abs(refL[i]-wkL[i]),Math.abs(refR[i]-wkR[i])); }
console.log('SPN vs worklet audio max-abs:', worst, worst===0?'BIT-IDENTICAL':'DIFFERS');

// compare beam stream (chunks concatenated) vs the SPN host's ring content
const beamFlat=new Float32Array(beamOut.length*256), beamFlatY=new Float32Array(beamOut.length*256);
beamOut.forEach((b,i)=>{ beamFlat.set(b.x,i*256); beamFlatY.set(b.y,i*256); });
// SPN host wrote TOT beam samples through the ring; last 16384 remain. Compare the final 16384 region, BOTH axes.
const RING=16384; const refTail=new Float32Array(RING), refTailY=new Float32Array(RING);
for(let i=0;i<RING;i++){ refTail[i]=ref.ringX[(ref.rw+i)&(RING-1)]; refTailY[i]=ref.ringY[(ref.rw+i)&(RING-1)]; }
const wkTail=beamFlat.slice(beamFlat.length-RING), wkTailY=beamFlatY.slice(beamFlatY.length-RING);
let bw=0; for(let i=0;i<RING;i++)bw=Math.max(bw,Math.abs(refTail[i]-wkTail[i]),Math.abs(refTailY[i]-wkTailY[i]));
console.log('beam chunks', beamOut.length, '(expected', TOT/256+')', 'X+Y tail max-abs:', bw, bw===0?'BIT-IDENTICAL':'DIFFERS');

// backpressure: starve the pool (stop returning buffers) -> chunks drop, audio continues, pool never grows
const inboxBefore=mainInbox.length;
let audioAlive=true;
for(let k=0;k<40;k++){ const L=new Float32Array(128),R=new Float32Array(128); proc.process([],[[L,R]]); if(k>30){ let s=0; for(let i=0;i<128;i++)s+=Math.abs(L[i]); if(s===0)audioAlive=false; } }
const dropped=mainInbox.filter(x=>x.t==='beam').length;
console.log('starved-pool: extra beam msgs', dropped, '(<=8 pool buffers)', 'audio alive:', audioAlive, (dropped<=8&&audioAlive)?'BACKPRESSURE OK':'FAIL');
const pass = worst===0 && bw===0 && dropped<=8 && audioAlive;
console.log(pass?'WORKLET PATH VERIFIED':'WORKLET PATH FAIL');
process.exit(pass?0:1);
