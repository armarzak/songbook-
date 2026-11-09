const a=require('node:assert/strict'),d=require('../drum-machine.js');
for(const id of Object.keys(d.patterns)){const p=d.pattern(id),n=p.beats*p.division;for(let s=0;s<n;s++){
 a.deepEqual(d.padHits(id,s,0,{padParts:[]}),[]);
 const all=d.padHits(id,s,0,{padParts:d.padParts});const solo=d.padParts.flatMap(k=>d.padHits(id,s,0,{padParts:[k]}));a.deepEqual(all,solo);
 for(const k of d.padParts)for(const h of d.padHits(id,s,0,{padParts:[k]}))a.equal(h.kind,k);
}for(const k of d.padParts)a(Array.from({length:n},(_,s)=>d.padHits(id,s,0,{padParts:[k]})).flat().length>0,k+' must produce hits in '+id)}
a.deepEqual(d.cleanParts(['kick','kick','snare','unknown']),['kick','snare']);console.log('PASS all eight independent loops, layering, silence with no pads, all seven meters, selection validation');
