// SynthCore rendered in 2048-blocks vs 16x128-blocks must be bit-identical (absolute counters).
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const m = html.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
class DCLogic { constructor(){ this.state={}; this._refs={}; } setState(s){ Object.assign(this.state,s); } }
global.window={SYNESTHESIA_BANKS:{}}; global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
const Component = new Function('DCLogic', m[1] + '\nreturn Component;')(DCLogic);
const lcg=(seed)=>{ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; };

function mkCore(seed){
  const c=new Component({}); c.ctx={sampleRate:48000}; c.running=true;
  c.state.drone=true; c.state.gen='lorenz'; c.state.eqTap='pre';
  c.P.jitter=0.3; c.P.fmSync=true; c.P.morphSync=true;
  const dyn={on:true,mode:'down',threshDb:-30,ratio:3,rangeDb:8,attackMs:5,releaseMs:80};
  c.eqBands=c._eqNormalize([{type:'bell',freqHz:500,gainDb:4,q:2,on:true,slopeDbOct:12,muted:false,soloed:false,dyn}]);
  c.core.eqBands=c.eqBands;
  const core=c.core;
  core.sampleRate=48000; core.gen='lorenz'; core.drone=true; core.eqPre=true; core.bpm=120; core.rng=lcg(seed);
  return core;
}
const TOT=2048*24;
const render=(core,blk)=>{ const L=new Float32Array(TOT),R=new Float32Array(TOT);
  const l=new Float32Array(blk),r=new Float32Array(blk);
  for(let o=0;o<TOT;o+=blk){ core.render(l,r,blk); L.set(l,o); R.set(r,o); }
  return [L,R]; };
const [aL,aR]=render(mkCore(1234),2048);
const [bL,bR]=render(mkCore(1234),128);
let worst=0; for(let i=0;i<TOT;i++){ worst=Math.max(worst,Math.abs(aL[i]-bL[i]),Math.abs(aR[i]-bR[i])); }
console.log('2048-block vs 128-block max-abs delta:', worst, worst===0?'BIT-IDENTICAL':'DIFFERS');
process.exit(worst===0?0:1);
