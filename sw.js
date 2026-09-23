/* AI 态势 · Service Worker
   策略：
   - 只接管同源页面壳：network-first，离线回退缓存
   - 跨域数据请求一律放行（不拦截），由浏览器直连，避免 SW 介入 CORS 失败
   - 成功的数据响应另存一份，离线时页面壳仍可打开
*/
const V = 'ai-radar-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // 跨域数据请求：完全放行，不 e.respondWith
  if (url.origin !== self.location.origin) return;

  // 同源页面壳：network-first
  e.respondWith((async () => {
    const cache = await caches.open(V);
    try {
      const res = await fetch(req);
      if (res && res.ok) { try { await cache.put(req, res.clone()); } catch {} }
      return res;
    } catch {
      const hit = (await cache.match(req)) || (await cache.match('./index.html'));
      return hit || new Response('offline', { status: 503 });
    }
  })());
});
