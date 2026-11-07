// FOLk Coffee Card: opens fast and works with bad or no signal.
// Our own files: network first, but fall back to the saved copy after 2.5s or when offline.
// Libraries and fonts (versioned): saved copy first.
// Sign-in and card data (Firebase) are never cached here.
const C = 'folk-card-v3';
const CORE = [
  './', './index.html', './style.css', './loyalty.js', './vouchers.js', './print-voucher.html', './config.js', './manifest.json',
  '../brand/folk-logo.png', '../icons/card-180.png', '../icons/card-192.png', '../icons/card-512.png',
];
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js',
];
const isLib = (u) =>
  u.hostname === 'cdnjs.cloudflare.com' || u.hostname === 'cdn.jsdelivr.net' ||
  u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com' ||
  (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/'));

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(C).then((c) => Promise.all([
    c.addAll(CORE).catch(() => {}),
    ...LIBS.map((u) => c.add(u).catch(() => {})),
  ])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // only tidy our own old caches: the planner's cache lives on the same site
  e.waitUntil(caches.keys()
    .then((k) => Promise.all(k.filter((x) => x.startsWith('folk-card-') && x !== C).map((x) => caches.delete(x))))
    .then(() => self.clients.claim()));
});

const put = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(C).then((c) => c.put(req, cp)); } return res; };

self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;

  if (u.origin === location.origin) {
    const nav = r.mode === 'navigate';
    // sign-in links carry ?apiKey=…&oobCode=…: still serve the saved page, the page reads the link itself
    const saved = () => caches.match(nav ? new URL(u.pathname, u).href : r, { ignoreSearch: nav })
      .then((m) => m || (nav ? caches.match('./index.html') : undefined));
    const net = fetch(r.url, { cache: 'no-cache', credentials: 'same-origin' }).then((res) => put(nav ? new URL(u.pathname, u).href : r, res));
    e.respondWith(new Promise((resolve) => {
      let done = false;
      const finish = (x) => { if (!done && x) { done = true; resolve(x); } };
      const t = setTimeout(() => saved().then(finish), 2500);
      net.then((res) => { clearTimeout(t); finish(res); })
        .catch(() => { clearTimeout(t); saved().then((m) => { finish(m); if (!done) resolve(Response.error()); }); });
    }));
    e.waitUntil(net.catch(() => {}));
    return;
  }

  if (isLib(u)) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => put(r, res))));
  }
});
