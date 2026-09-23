/* AI 态势 · Service Worker
   策略：
   - 数据接口：network-first，成功即写缓存，失败回退缓存（断网仍可看上次结果）
   - 页面壳：network-first，离线回退 index.html
   注意：数据请求用 req.url 重建 Request，避免在 fetch handler 内重放原始
   Request 对象触发递归拦截。
*/
const V = 'ai-radar-v2';
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

const DATA_HOSTS = new Set([
  'cdn.jsdelivr.net',
  'openrouter.ai',
  'hn.algolia.com',
  'api.github.com',
  'duanyytop.github.io',
]);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // 数据接口：network-first，失败回退缓存
  if (DATA_HOSTS.has(url.hostname)) {
    e.respondWith((async () => {
      const cache = await caches.open(V);
      try {
        const res = await fetch(req.url, { mode: 'cors', credentials: 'omit', cache: 'no-store' });
        if (res && res.ok) {
          try { await cache.put(req.url, res.clone()); } catch {}
        }
        return res;
      } catch (err) {
        const hit = await cache.match(req.url);
        if (hit) return hit;
        return new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    })());
    return;
  }

  // 页面壳：network-first
  if (url.origin === self.location.origin) {
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
  }
});
