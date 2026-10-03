const V='songbook-v8';
const SHELL=['./','./index.html','./manifest.json','./icon-180.png','./icon-512.png'];
const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(async c=>{
  await c.addAll(SHELL);
  // the PDF reader, so PDF import also works offline; skipped quietly if the network is down
  await Promise.all(['pdf.min.js','pdf.worker.min.js'].map(f=>c.add(PDFJS+f).catch(()=>{})));
}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  const u=new URL(r.url);
  // the page itself: fresh copy when online, saved copy when offline
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put('./index.html',cp));return res})
      .catch(()=>caches.match('./index.html')));
    return;
  }
  // own files, fonts and the PDF reader: saved copy first, refresh in the background
  if(u.origin===location.origin||/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)||r.url.startsWith(PDFJS)){
    e.respondWith(caches.match(r,{ignoreVary:true}).then(hit=>{
      const net=fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>hit);
      return hit||net;
    }));
  }
});
