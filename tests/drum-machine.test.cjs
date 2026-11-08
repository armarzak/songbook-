const assert=require('node:assert/strict'),D=require('../drum-machine.js');
assert.equal(Object.keys(D.patterns).length,7);
assert.deepEqual(D.hits('rock',0).map(h=>h.kind),['kick','hat']);
assert(D.hits('rock',4).some(h=>h.kind==='snare'));
assert(D.hits('reggae',8).some(h=>h.kind==='kick'));assert(!D.hits('reggae',0).some(h=>h.kind==='kick'));
for(const [id,p] of Object.entries(D.patterns)){
 const length=p.beats*p.division;
 for(let step=0;step<length;step++)for(const hit of D.hits(id,step)){assert(hit.velocity>0&&hit.velocity<=1);assert(['kick','snare','hat','open','rim','clap','ghost'].includes(hit.kind));}
 for(const bpm of [30,60,90,120,180,240])assert(Math.abs(length*D.stepSeconds(bpm,id)-p.beats*60/bpm)<1e-10);
 assert.equal(D.stepSeconds(60,id),2*D.stepSeconds(120,id));
 for(const [kind,steps] of Object.entries(p).filter(([,v])=>Array.isArray(v))){assert.equal(steps.length,new Set(steps).size);assert(steps.every(s=>Number.isInteger(s)&&s>=0&&s<length),id+' '+kind);}
}
assert.equal(D.pattern('blues').division,3);assert.equal(D.pattern('ballad').beats,6);
console.log('PASS: seven groove structures, classic kick/snare anchors, shuffle/six-eight timing, 30–240 BPM scaling and valid hit velocities');
