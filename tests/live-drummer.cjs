const assert=require('node:assert/strict'),d=require('../drum-machine.js');
for(const id of Object.keys(d.patterns)){
 const p=d.pattern(id),n=p.beats*p.division;for(let s=0;s<n;s++)assert.deepEqual(d.performanceHits(id,s,0,{}).map(({offset,...h})=>h),d.hits(id,s));
 const o={enabled:true,humanize:80,swing:90,fills:100,complexity:90};
 for(let b=0;b<16;b++){let duration=0;for(let s=0;s<n;s++){const h=d.performanceHits(id,s,b,o);assert.deepEqual(h,d.performanceHits(id,s,b,o));for(const x of h){assert(x.velocity>0&&x.velocity<=1);assert(x.offset>=0&&x.offset<=.009)}duration+=d.liveStepSeconds(120,id,s,o)}assert(Math.abs(duration-n*d.stepSeconds(120,id))<1e-9)}
 assert(d.performanceHits(id,n-1,3,o).some(h=>h.kind==='tom'));
}
assert.equal(d.settings({intensity:999,humanize:-9}).intensity,100);assert.equal(d.settings({humanize:-9}).humanize,0);
assert.notDeepEqual(d.performanceHits('rock',15,1,{enabled:true,complexity:100},true),d.performanceHits('rock',15,1,{enabled:true,complexity:100},false));
console.log('PASS: all seven grooves; legacy mode; repeatable variation; fill at phrase boundary; forced fill; bounded dynamics; swing preserves bar duration for all meters');
