const assert=require('node:assert/strict');require('../ai-align.js');
const rows=[{li:0,text:'Первая строка песни'},{li:1,text:'Строка которую не пели'},{li:2,text:'Первая строка песни'}];
const chunks=[{text:'Первая',timestamp:[1,2]},{text:'строка',timestamp:[2,3]},{text:'песни',timestamp:[3,4]},{text:'Первая',timestamp:[10,11]},{text:'строка',timestamp:[11,12]},{text:'песни',timestamp:[12,13]}];
const a=FCAIAlign.align(rows,chunks);assert.equal(a.marks[0],1);assert.equal(a.marks[1],null);assert.equal(a.marks[2],10);assert.deepEqual(a.wmarks[2],[10,11,12]);assert.throws(()=>FCAIAlign.align(rows,[]));console.log('PASS AI alignment: repeated lyrics, word times, unmatched lines remain unmarked');
