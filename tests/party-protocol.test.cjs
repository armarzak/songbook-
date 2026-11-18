const assert=require('node:assert/strict');global.window=globalThis;require('../party-protocol.js');
(async()=>{
 const invitation={app:'FireChordsParty',version:1,id:'12345678-abcd-ef00-1234-123456789012',description:{type:'offer',sdp:'v=0\r\na=candidate:local test\r\n'+Array.from({length:100},(_,i)=>i+':'+crypto.randomUUID()).join('\n')}};
 const frames=await FCPProtocol.encode(invitation),reader=FCPProtocol.collector();let result;
 for(const frame of [...frames].reverse()){await reader.add(frame);result=await reader.add(frame)}
 assert.deepEqual(result.value,invitation,'unordered and repeated QR frames round trip');
 await assert.rejects(reader.add('https://example.com/not-party'));
 await assert.rejects(reader.add('FCP1|0123456789abcdef|0|99|AAAA'));
 const other=await FCPProtocol.encode({...invitation,id:'different-invitation'});reader.reset();await reader.add(frames[0]);
 for(const f of other)result=await reader.add(f);
 assert.equal(result.value.id,'different-invitation','new invitation resets incomplete previous scan');
 await assert.rejects(FCPProtocol.encode({...invitation,description:{type:'invalid',sdp:'test'}}));
 console.log('PASS QR protocol: round trip, unordered/duplicate frames, format and size bounds, new invitation reset');
})().catch(e=>{console.error(e);process.exitCode=1});
