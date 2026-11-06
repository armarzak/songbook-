const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const h=fs.readFileSync('index.html','utf8'),ctx=vm.createContext({});vm.runInContext(h.slice(h.indexOf('const NS='),h.indexOf('/* ---------- song text parsing')),ctx);
const run=s=>vm.runInContext(s,ctx),plain=s=>JSON.parse(run(`JSON.stringify(${s})`));
for(const m of h.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!/src=|application\/json/.test(m[1]))new vm.Script(m[2]);
assert.equal(plain('CHART_CORRECTIONS').length,17);
assert.deepEqual(plain('CHART.flat().filter(v=>!v.check.ok)'),[]);
const fixtures={Cdim:[0,3,6],Cdim7:[0,3,6,9],CmMaj7:[0,3,11],Cm9:[0,3,10,2],Cmaj9:[0,4,11,2],C7b9:[0,4,10,1],C7b5:[0,4,6,10],C7sharp9:[0,4,10,3]};
for(const [key,required] of Object.entries(fixtures)){
  const name=key.replace('sharp','#'),r=plain(`getVoicings('${name}')`);assert(r.list.length,name);assert.equal(r.approx,false,name);
  for(const v of r.list){const notes=new Set(v.frets.flatMap((f,i)=>f<0?[]:[([4,9,2,7,11,4][i]+f)%12]));for(const n of required)assert(notes.has(n),`${name}: missing ${n}`);}
}
for(const name of ['D/F#','C/G','G/B','Am/G','C/B','Dmaj9/F#','F/C'])for(const v of plain(`getVoicings('${name}').list`)){
  const bass=Math.min(...v.frets.map((f,i)=>f<0?Infinity:[40,45,50,55,59,64][i]+f))%12;assert.equal(bass,run(`parseChord('${name}').bass`),name);
}
assert(run("parseChord('C6/9')"));assert.equal(run("normQ(parseChord('C6/9').q).q"),'6add9');
const audit=plain(`(()=>{let count=0,bad=[],missing=[];for(const root of NS)for(const q of Object.keys(TONES)){const name=root+(q==='maj'?'':q),r=getVoicings(name);count++;if(!r.list.length||r.approx)missing.push(name);for(const v of r.list)if(!checkShape(name,v.frets).ok)bad.push(name);}return {count,bad,missing};})()`);
assert.deepEqual(audit.bad,[]);assert.deepEqual(audit.missing,[]);
run("setShapes({C:{frets:[-1,3,2,0,1,0],base:1,alts:[{frets:[8,10,10,9,8,8],base:8}]}})");assert.equal(run("getVoicings('C').list.length"),2);assert.equal(run("getVoicings('C').list[0].label"),'Мой вариант 1');run('setShapes({})');
const svg=run("diagram({frets:[-1,-1,2,3,2,3],base:9},false)");assert(svg.includes('cy="86"'));assert(svg.includes('role="img"'));
assert(run("diagram({frets:[1,3,3,2,1,1],barre:true},true)").includes('rx="4"'));
console.log(`PASS: ${audit.count} root/quality combinations, 132 reference cells, slash bass, independent note fixtures, saved shapes, SVG positions and script syntax`);



// Formula composition, explicit interval sets and thin barre and equal fret cells.
for(const [name,expected] of Object.entries({'Cadd#11':[0,4,7,6],'C7(b9,#11)':[0,4,7,10,1,6],'CmMaj13':[0,3,7,11,2,5,9],'C7no3':[0,7,10],'C(1,b3,b5,6)':[0,3,6,9]})){
 const result=plain("normQ(parseChord('"+name+"').q)");assert.equal(result.approx,false,name);assert.deepEqual(plain("TONES["+JSON.stringify(result.q)+"]").sort((a,b)=>a-b),expected.sort((a,b)=>a-b),name);
}
const barreSvg=run('diagram({frets:[1,3,3,2,1,1],barre:true},false)');assert(barreSvg.includes('height="8"'));assert(barreSvg.includes('r="11"'));
assert.deepEqual(plain("requiredTones(normQ('1,3,5,7').q)"),[0,4,7,11]);
console.log('PASS: interval formulas, explicit required tones and equal fret cells with a thin barre');

const fretYs=[...barreSvg.matchAll(/<line class="fr"[^>]*y1="(\d+)"/g)].map(m=>Number(m[1]));assert.deepEqual(fretYs,[70,102,134,166]);assert(barreSvg.includes('cy="54"'));
