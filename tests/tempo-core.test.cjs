const {test}=require('node:test');
const assert=require('node:assert/strict');
const {metadata,estimate}=require('../tempo-core.js');
const array=b=>Uint8Array.from(b).buffer;
const ascii=s=>Array.from(Buffer.from(s));
const sync=n=>[n>>21&127,n>>14&127,n>>7&127,n&127];
function id3(version,key,value){
 const content=[0,...ascii(value)],n=content.length;
 const frame=version===2?[...ascii(key),n>>16&255,n>>8&255,n&255,...content]:[...ascii(key),...(version===4?sync(n):[0,0,0,n]),0,0,...content];
 return array([...ascii('ID3'),version,0,0,...sync(frame.length),...frame]);
}
test('reads BPM in ID3 versions used by old and current MP3 encoders',()=>{
 for(const [version,key] of [[2,'TBP'],[3,'TBPM'],[4,'TBPM']])assert.equal(metadata(id3(version,key,'149')).bpm,149);
 assert.equal(metadata(id3(3,'TXXX','BPM\0'+'123')).bpm,123);
 assert.equal(metadata(id3(3,'TBPM','999')),null);
 assert.equal(metadata(id3(3,'TBPM','not a tempo')),null);
});
test('missing, truncated or unrelated tags do not invent BPM',()=>{
 assert.equal(metadata(array([])),null);
 assert.equal(metadata(id3(2,'TSS','Logic Pro 11.2.2')),null);
 assert.equal(metadata(id3(4,'TBPM','123').slice(0,21)),null);
});
test('reads iTunes integer tempo in an M4A metadata tree',()=>{
 const box=(name,payload)=>{const b=Buffer.alloc(8+payload.length);b.writeUInt32BE(b.length);b.write(name,4,'latin1');Buffer.from(payload).copy(b,8);return b};
 const data=Buffer.alloc(10);data.writeUInt32BE(21);data.writeUInt16BE(128,8);
 const file=box('moov',box('udta',box('meta',Buffer.concat([Buffer.alloc(4),box('ilst',box('tmpo',box('data',data)))]))));
 assert.equal(metadata(array(file)).bpm,128);
});
function clicks(bpm,duration=45){
 const rate=8000,samples=new Float32Array(rate*duration);
 for(let at=rate;at<samples.length;at+=rate*60/bpm)for(let j=0;j<240&&Math.round(at)+j<samples.length;j++)samples[Math.round(at)+j]=Math.sin(j*0.3)*Math.exp(-j/40);
 return samples;
}
test('detects slow and fast pulses without collapsing 180 BPM to 60',()=>{
 for(const bpm of [60,75,90,100,120,140,180,200]){
  const result=estimate(clicks(bpm),8000);assert.ok(result);assert.ok(Math.abs(result.bpm-bpm)<=1,`${bpm} detected as ${result.bpm}`);assert.ok(result.confidence>=0.65);
 }
});
test('silence and too-short files do not produce a tempo',()=>{
 assert.equal(estimate(new Float32Array(80000),8000),null);
 assert.equal(estimate(clicks(120,3),8000),null);
});
