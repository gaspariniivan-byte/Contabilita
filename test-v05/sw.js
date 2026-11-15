const C='contabilita-v05';
const A=['./','./index.html','./styles.css','./app.js','./seed.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('contabilita-v')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(resp=>{if(resp.ok){const copy=resp.clone();e.waitUntil(caches.open(C).then(c=>c.put(e.request,copy)))}return resp}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));});
