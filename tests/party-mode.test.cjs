/* Run with node tests/party-mode.test.cjs. Uses installed Chrome and Node built-ins. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {spawn}=require('node:child_process'),os=require('node:os'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
class CDP{
 constructor(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.ready=new Promise((r,j)=>{this.ws.onopen=r;this.ws.onerror=j});this.ws.onmessage=e=>{const d=JSON.parse(e.data);if(d.id){const p=this.pending.get(d.id);this.pending.delete(d.id);d.error?p.reject(Error(d.error.message)):p.resolve(d.result)}}}
 async send(method,params={}){await this.ready;return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
 close(){this.ws.close()}
}
(async()=>{
 const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.join(root,pathname==='/'?'index.html':pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port,profile=fs.mkdtempSync(path.join(os.tmpdir(),'fc-party-test-'));
 const chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--disable-background-networking','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 let clients=[];const fatal=setTimeout(()=>{chrome.kill();server.close();console.error('Party test timed out');process.exitCode=1},90000);
 try{
 const debuggerPort=await new Promise((r,j)=>{let text='';chrome.stderr.on('data',b=>{text+=b;const m=text.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);if(m)r(+m[1])});chrome.on('error',j);chrome.on('exit',code=>j(Error('Chrome exited '+code)))});
 async function tab(){const target=await(await fetch(`http://127.0.0.1:${debuggerPort}/json/new?${encodeURIComponent('http://127.0.0.1:'+port+'/index.html')}`,{method:'PUT'})).json();const p=new CDP(target.webSocketDebuggerUrl);clients.push(p);await p.send('Emulation.setDeviceMetricsOverride',{width:393,height:852,deviceScaleFactor:1,mobile:true});for(let n=0;n<100;n++){if(await p.eval(`typeof FCParty!=='undefined'&&typeof S!=='undefined'&&S.loaded`))break;await delay(100)}await p.eval(`document.getElementById('fc-splash')?.remove();document.getElementById('fc-campfire')?.remove();`);return p}
 const host=await tab(),guest=await tab();
 // Block external requests after initial load; all libraries and peer traffic are local.
 for(const p of [host,guest]){await p.send('Network.enable');await p.send('Network.setBlockedURLs',{urls:['https://*']})}
 await host.eval(`S.songs[0].body=['Am','Первая строка','Вторая строка','Третья строка','Четвёртая строка','Пятая строка'].join(String.fromCharCode(10));renderSong(S.songs[0].id);FCParty.open();document.querySelector('[data-party="invite"]').click()`);
 for(let n=0;n<150;n++){if(await host.eval(`!!document.querySelector('#party-qr svg')`))break;await delay(100)}
 const png=`(async()=>{const svg=document.querySelector('#party-qr svg');if(!svg)return null;const canvas=document.createElement('canvas');canvas.width=900;canvas.height=900;const c=canvas.getContext('2d'),image=new Image();image.src='data:image/svg+xml;base64,'+btoa(new XMLSerializer().serializeToString(svg));await image.decode();c.fillStyle='white';c.fillRect(0,0,900,900);c.drawImage(image,0,0,900,900);const d=c.getImageData(0,0,900,900),code=jsQR(d.data,900,900);if(!code)throw Error('Generated QR cannot be decoded');return{url:canvas.toDataURL('image/png'),frame:code.data}})()`;
 async function exchange(from,to,expected){await to.eval('FCParty.open()');const seen=new Set();for(let n=0;n<40;n++){const qr=await from.eval(png);if(!qr)throw Error('No outgoing QR');if(!seen.has(qr.frame)){seen.add(qr.frame);await to.eval(`(async()=>{const b=await(await fetch(${JSON.stringify(qr.url)})).blob(),dt=new DataTransfer();dt.items.add(new File([b],'qr.png',{type:'image/png'}));const i=document.getElementById('party-image');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));})()`)}await delay(250);if(await to.eval(expected))return seen.size;await delay(200)}throw Error('QR exchange failed: '+await to.eval(`document.getElementById('party-note')?.textContent`))}
 const offerParts=await exchange(host,guest,`document.querySelector('.party-panel h3')?.textContent==='Ответ ведущему'`);
 const answerParts=await exchange(guest,host,`!document.querySelector('#party-qr')`);
 for(let n=0;n<80;n++){if(await host.eval(`document.getElementById('party-status')?.textContent.includes('участников: 1')`))break;await delay(100)}
 assert.equal(await host.eval(`document.getElementById('party-status').textContent.includes('участников: 1')`),true,'peer connection established');
 await guest.eval('closeSheet()');await host.eval(`closeSheet();const s=findSong(S.cur);s.marks=[0,3,6,9,12];s.wmarks=null;TR.el={paused:false,ended:false,currentTime:6.1,duration:100,playbackRate:1,pause(){this.paused=true}}`);
 await delay(1500);
 assert.equal(await guest.eval(`document.querySelector('.ln.cur')?.dataset.li`),'2','guest follows backing time');
 assert.equal(await guest.eval('TR.el?.paused!==false'),true,'guest never plays backing');
 await guest.eval(`document.querySelector('[data-act="viewmode"][data-v="1"]').click();const s=document.getElementById('text-view');s.value='karaoke';s.dispatchEvent(new Event('change',{bubbles:true}))`);
 await delay(400);
 assert.equal(await guest.eval('document.body.classList.contains("karaoke")'),true,'independent guest karaoke');
 assert.equal(await host.eval('document.body.classList.contains("karaoke")'),false,'host display unchanged');
 assert.equal(await guest.eval(`document.querySelector('.ln.cur')?.dataset.li`),'2','highlight survives display switch');
 await host.eval('TR.el.currentTime=3.1;TR.el.paused=true');await delay(800);
 assert.equal(await guest.eval(`document.querySelector('.ln.cur')?.dataset.li`),'1','pause and backward seek');await delay(600);
 assert.equal(await guest.eval(`document.querySelector('.ln.cur')?.dataset.li`),'1','pause freezes text');
 const secondGuest=await tab();await host.eval(`FCParty.open();document.querySelector('[data-party="invite"]').click()`);
 for(let n=0;n<100;n++){if(await host.eval('!!document.querySelector("#party-qr svg")'))break;await delay(100)}
 await exchange(host,secondGuest,`document.querySelector('.party-panel h3')?.textContent==='Ответ ведущему'`);
 await exchange(secondGuest,host,`!document.querySelector('#party-qr')`);await delay(600);
 assert.equal(await host.eval(`document.getElementById('party-status').textContent.includes('участников: 2')`),true,'two simultaneous guests');
 await secondGuest.eval('closeSheet()');await delay(300);
 assert.equal(await secondGuest.eval(`document.querySelector('.ln.cur')?.dataset.li`),'1','late participant receives paused position');
 assert.equal(await guest.eval(`document.querySelector('.ln.cur')?.dataset.li`),'1','first participant remains synchronized');
 await host.eval('FCParty.stop()');await delay(400);
 assert.equal(await guest.eval(`document.querySelector('.party-badge').textContent.includes('нет соединения')`),true,'disconnect visible');
 await guest.eval('FCParty.stop()');assert.equal(await guest.eval('document.body.classList.contains("party-guest")'),false);
 console.log(JSON.stringify({PASS:true,offerParts,answerParts,checks:['QR image round trip','offline local WebRTC connection','backing time sync','guest silent','independent karaoke','seek and pause','two simultaneous guests','late join at paused position','disconnect and leave']}));
 }finally{clearTimeout(fatal);clients.forEach(c=>c.close());chrome.kill();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
