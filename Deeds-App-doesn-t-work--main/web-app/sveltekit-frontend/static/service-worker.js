const CACHE_NAME = 'wardennetes-v1.0.0';
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;
const DATA_CACHE_NAME = `${CACHE_NAME}-data`;

// Critical assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/cases',
  '/criminals',
  '/offline',
  '/manifest.webmanifest',
  '/favicon.png',
  '/favicon.ico'
];

// API endpoints that can be cached
const DATA_ENDPOINTS = [
  '/api/cases',
  '/api/criminals',
  '/api/statutes',
  '/api/evidence'
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        const staticCache = await caches.open(STATIC_CACHE_NAME);
        console.log('[SW] Caching static assets...');
        await staticCache.addAll(STATIC_ASSETS);
        
        console.log('[SW] Static assets cached successfully');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('[SW] Error during installation:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames
          .filter(name => name.startsWith('wardennetes-') && name !== STATIC_CACHE_NAME && name !== DATA_CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          });
        
        await Promise.all(deletePromises);
        
        // Take control of all clients
        await clients.claim();
        
        console.log('[SW] Service worker activated successfully');
      } catch (error) {
        console.error('[SW] Error during activation:', error);
      }
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // API endpoints - Network first with fallback
    if (url.pathname.startsWith('/api/')) {
      return await handleApiRequest(request);
    }
    
    // Static assets - Cache first
    if (isStaticAsset(url.pathname)) {
      return await handleStaticRequest(request);
    }
    
    // HTML pages - Stale while revalidate
    if (url.pathname.endsWith('/') || url.pathname.includes('.html') || !url.pathname.includes('.')) {
      return await handlePageRequest(request);
    }
    
    // Default to network first
    return await handleNetworkFirst(request);
    
  } catch (error) {
    console.error('[SW] Error handling request:', error);
    return await handleOfflineRequest(request);
  }
}

// API request handler - Network first with cache fallback
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(DATA_CACHE_NAME);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      // Clone response before caching
      const responseClone = response.clone();
      await cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed for API, trying cache:', url.pathname);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Add offline indicator header
      const modifiedResponse = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: {
          ...cachedResponse.headers,
          'X-Served-By': 'service-worker-cache',
          'X-Cache-Date': new Date().toISOString()
        }
      });
      return modifiedResponse;
    }
    
    // Return offline response for critical endpoints
    return createOfflineApiResponse(url.pathname);
  }
}

// Static asset handler - Cache first
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network and cache
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Page request handler - Stale while revalidate
async function handlePageRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  // Get from cache first
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Return cached version immediately if available
  if (cachedResponse) {
    networkPromise; // Update cache in background
    return cachedResponse;
  }
  
  // Wait for network if no cache
  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  // Fallback to offline page
  return await handleOfflineRequest(request);
}

// Network first handler
async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Offline request handler
async function handleOfflineRequest(request) {
  const url = new URL(request.url);
  
  // Try to serve cached offline page for HTML requests
  if (request.headers.get('accept')?.includes('text/html')) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const offlinePage = await cache.match('/offline');
    
    if (offlinePage) {
      return offlinePage;
    }
    
    // Create basic offline response
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>WardenNet - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; text-align: center; padding: 2rem; }
            .offline-message { max-width: 500px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>⚡ You're Offline</h1>
            <p>WardenNet is currently unavailable. Please check your connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // Return generic offline response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Create offline API responses
function createOfflineApiResponse(pathname) {
  const offlineData = {
    '/api/cases': { cases: [], message: 'Offline - showing cached data' },
    '/api/criminals': { criminals: [], message: 'Offline - showing cached data' },
    '/api/statutes': { statutes: [], message: 'Offline - showing cached data' },
    '/api/evidence': { evidence: [], message: 'Offline - showing cached data' }
  };
  
  const data = offlineData[pathname] || { message: 'Service unavailable offline' };
  
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Served-By': 'service-worker-offline'
    }
  });
}

// Helper functions
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => pathname.endsWith(ext)) || pathname === '/favicon.ico';
}

// Message handler for communication with the app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage({ type: 'CACHE_STATS', payload: stats });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload?.cacheType).then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    case 'PRECACHE_URLS':
      precacheUrls(payload?.urls || []).then(() => {
        event.ports[0].postMessage({ type: 'PRECACHE_COMPLETE' });
      });
      break;
  }
});

// Cache management functions
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = {
      size: keys.length,
      urls: keys.map(req => req.url)
    };
  }
  
  return stats;
}

async function clearCache(cacheType = 'all') {
  const cacheNames = await caches.keys();
  
  const deletePromises = cacheNames
    .filter(name => {
      if (cacheType === 'all') return true;
      if (cacheType === 'static') return name.includes('static');
      if (cacheType === 'data') return name.includes('data');
      return false;
    })
    .map(name => caches.delete(name));
  
  await Promise.all(deletePromises);
}

async function precacheUrls(urls) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  const fetchPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn('[SW] Failed to precache:', url, error);
    }
  });
  
  await Promise.all(fetchPromises);
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'case-submission':
      event.waitUntil(syncCaseSubmissions());
      break;
    case 'evidence-upload':
      event.waitUntil(syncEvidenceUploads());
      break;
  }
});

async function syncCaseSubmissions() {
  // Handle offline case submissions when connection is restored
  console.log('[SW] Syncing case submissions...');
  // Implementation would retrieve from IndexedDB and submit to server
}

async function syncEvidenceUploads() {
  // Handle offline evidence uploads when connection is restored
  console.log('[SW] Syncing evidence uploads...');
  // Implementation would retrieve from IndexedDB and upload to server
}

// Push notification handler
self.addEventListener('push', (event) => {
  const options = {
    body: 'You have new case updates',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: 'case-notification',
    data: {
      url: '/dashboard'
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard',
        icon: '/favicon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  if (event.data) {
    const payload = event.data.json();
    options.body = payload.message || options.body;
    options.data.url = payload.url || options.data.url;
  }
  
  event.waitUntil(
    self.registration.showNotification('WardenNet', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/dashboard')
    );
  }
});

console.log('[SW] Service worker loaded successfully');
