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
assert(run("diagram({frets:[1,3,3,2,1,1],barre:true},true)").includes('rx="9"'));
console.log(`PASS: ${audit.count} root/quality combinations, 132 reference cells, slash bass, independent note fixtures, saved shapes, SVG positions and script syntax`);


