const assert=require('node:assert/strict'),D=require('../drum-machine.js');
for(const part of ['kick','snare','clap']){const rows=[];for(let v=0;v<6;v++)rows.push(Array.from({length:16},(_,step)=>D.padHits('rock',step,0,{padParts:[part],padVariants:{[part]:v}}).length).join(''));assert.equal(new Set(rows).size,6,part)}
for(const part of D.padParts){const row=section=>Array.from({length:16},(_,step)=>D.padHits('rock',step,0,{section,padParts:[part]}).length).join('');assert.notEqual(row('verse'),row('chorus'),part)}
console.log('PASS six distinct kick/snare/percussion rhythms; every pad changes rhythm between verse and chorus');
