/* AI 态势 · Service Worker
   策略：
   - 页面壳（html/manifest/icon）：network-first，离线回退缓存
   - 数据接口：stale-while-revalidate，断网时仍能看到上次结果
*/
const V = 'ai-radar-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const DATA_HOSTS = [
  'cdn.jsdelivr.net',
  'openrouter.ai',
  'hn.algolia.com',
  'api.github.com',
  'duanyytop.github.io',
];

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch { return; }

  // 数据接口：stale-while-revalidate
  if (DATA_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const cache = await caches.open(V);
      const hit = await cache.match(req);
      const net = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (hit) { net; return hit; }                 // 先给缓存，后台刷新
      const res = await net;
      if (res) return res;
      return new Response(JSON.stringify({ error: 'offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    })());
    return;
  }

  // 页面壳：network-first
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const cache = await caches.open(V);
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        const hit = await cache.match(req) || await cache.match('./index.html');
        if (hit) return hit;
        return new Response('offline', { status: 503 });
      }
    })());
  }
});
