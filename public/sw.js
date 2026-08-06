const CACHE_VERSION = 'quake-relief-v1';
const SHELL_CACHE = CACHE_VERSION + '-shell';
const TILE_CACHE = CACHE_VERSION + '-tiles';
const API_CACHE = CACHE_VERSION + '-api';

const MAX_CACHED_TILES = 500;

// App shell resources to pre-cache
const SHELL_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Offline fallback HTML
const OFFLINE_FALLBACK = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#0f172a">
  <title>Quake Relief \u2014 Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 24px;
    }
    .container { max-width: 400px; }
    .icon {
      width: 80px; height: 80px; margin: 0 auto 24px;
      border: 3px solid #f97316; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      animation: pulse 2s ease-in-out infinite;
    }
    .icon svg { width: 40px; height: 40px; }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
      50% { box-shadow: 0 0 0 16px rgba(249, 115, 22, 0); }
    }
    h1 { font-size: 24px; margin-bottom: 12px; color: #f97316; }
    p { font-size: 16px; color: #94a3b8; line-height: 1.6; }
    .spinner {
      display: inline-block; width: 24px; height: 24px;
      border: 3px solid #334155; border-top-color: #f97316;
      border-radius: 50%; animation: spin 1s linear infinite;
      margin-top: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2">
        <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    </div>
    <h1>Offline Mode</h1>
    <p>Quake Relief Command Center is temporarily offline.<br>Attempting to reconnect...</p>
    <div class="spinner"></div>
  </div>
</body>
</html>
`;

// Offline coordinate queue for sync (in-memory — localStorage unavailable in SW)
var coordQueue = [];

// \u2500\u2500\u2500 Install \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function(cache) { return cache.addAll(SHELL_URLS); }).then(function() { return self.skipWaiting(); })
  );
});

// \u2500\u2500\u2500 Activate \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key.startsWith('quake-relief-') && key !== SHELL_CACHE && key !== TILE_CACHE && key !== API_CACHE; })
          .map(function(key) { return caches.delete(key); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// \u2500\u2500\u2500 Fetch \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // OSM Tile requests \u2014 Network-First with Cache fallback
  if (
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('cartodb') ||
    url.hostname.includes('basemaps.cartocdn.com') ||
    url.pathname.match(/\/\d+\/\d+\/\d+/)
  ) {
    event.respondWith(tileStrategy(request, url));
    return;
  }

  // API responses \u2014 Stale-While-Revalidate
  if (url.pathname.startsWith('/api/state') || url.pathname.startsWith('/api/incidents')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // App shell / navigation \u2014 Cache-First, fallback to network, then offline page
  if (request.mode === 'navigate' || isAppShellRequest(url)) {
    event.respondWith(shellStrategy(request));
    return;
  }
});

// \u2500\u2500\u2500 Strategies \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

/**
 * Cache-First for app shell resources
 */
async function shellStrategy(request) {
  var cached = await caches.match(request, { cacheName: SHELL_CACHE });
  if (cached) return cached;

  try {
    var response = await fetch(request);
    if (response.ok) {
      var cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    // Network failed \u2014 serve offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return new Response(OFFLINE_FALLBACK, {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network-First + Cache fallback for OSM tiles.
 * Keeps cache size bounded at MAX_CACHED_TILES.
 */
async function tileStrategy(request, url) {
  var cache = await caches.open(TILE_CACHE);
  var cached = await cache.match(request);

  try {
    var response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      trimTileCache(cache);
    }
    return response;
  } catch (e) {
    // Network failed \u2014 return cached tile or transparent pixel
    if (cached) return cached;
    return new Response(createTransparentPixel(), {
      headers: { 'Content-Type': 'image/png' },
    });
  }
}

/**
 * Stale-While-Revalidate for API responses.
 * Returns cached immediately, fetches fresh in background.
 */
async function staleWhileRevalidate(request, cacheName) {
  var cache = await caches.open(cacheName);
  var cached = await cache.match(request);

  var fetchPromise = fetch(request)
    .then(function(response) {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(function() {
      // Silently fail \u2014 cached version already returned
    });

  // Return cached if available, otherwise wait for network
  if (cached) {
    void fetchPromise; // fire-and-forget background update
    return cached;
  }

  return fetchPromise;
}

// \u2500\u2500\u2500 Tile Cache Management \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

async function trimTileCache(cache) {
  var keys = await cache.keys();
  if (keys.length <= MAX_CACHED_TILES) return;

  var toRemove = keys.slice(0, keys.length - MAX_CACHED_TILES);
  await Promise.all(toRemove.map(function(key) { return cache.delete(key); }));
}

function createTransparentPixel() {
  return new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x62, 0x00, 0x00, 0x00, 0x02,
    0x00, 0x01, 0xe5, 0x27, 0xde, 0xfc, 0x00, 0x00,
    0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
    0x60, 0x82,
  ]).buffer;
}

function isAppShellRequest(url) {
  var appShellExtensions = ['.js', '.css', '.woff2', '.woff', '.ttf', '.svg', '.ico'];
  var path = url.pathname;
  return (
    url.origin === self.location.origin &&
    appShellExtensions.some(function(ext) { return path.endsWith(ext); })
  );
}

// \u2500\u2500\u2500 Background Sync \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n
self.addEventListener('sync', function(event) {
  if (event.tag === 'quake-relief-coordinates') {
    event.waitUntil(replayCoordinateQueue());
  }
});

async function replayCoordinateQueue() {
  var queue = getCoordQueue();
  if (queue.length === 0) return;

  for (var i = 0; i < queue.length; i++) {
    var entry = queue[i];
    try {
      var response = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry.payload),
      });
      if (response.ok) {
        removeCoordEntry(entry.id);
      }
    } catch (e) {
      break;
    }
  }
}

function getCoordQueue() {
  return coordQueue || [];
}

function removeCoordEntry(id) {
  coordQueue = coordQueue.filter(function(e) { return e.id !== id; });
}

// \u2500\u2500\u2500 Message Handler (coordinate queuing from main thread) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'QUEUE_COORDINATE') {
    var entry = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 9),
      payload: event.data.payload,
    };
    coordQueue.push(entry);
  }
});
