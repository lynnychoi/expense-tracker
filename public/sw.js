// Service Worker for PWA functionality
const CACHE_NAME = 'gaegyebu-v1'
const STATIC_CACHE = 'gaegyebu-static-v1'
const DYNAMIC_CACHE = 'gaegyebu-dynamic-v1'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/transactions',
  '/budget',
  '/analytics',
  '/reports',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
]

// API routes to cache
const API_CACHE_PATTERNS = [
  /^\/api\/transactions/,
  /^\/api\/budgets/,
  /^\/api\/households/
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        // Take control of all open clients
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle different types of requests
  if (request.method === 'GET') {
    if (isStaticFile(url.pathname)) {
      // Static files - cache first
      event.respondWith(cacheFirst(request))
    } else if (isAPIRequest(url.pathname)) {
      // API requests - network first with cache fallback
      event.respondWith(networkFirst(request))
    } else {
      // Other requests - stale while revalidate
      event.respondWith(staleWhileRevalidate(request))
    }
  }
})

// Cache strategies
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, networkResponse.clone())
    return networkResponse
  } catch (error) {
    console.error('Cache first strategy failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful API responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', error)
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: '인터넷 연결을 확인해주세요' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      cache.put(request, networkResponse.clone())
      return networkResponse
    })
    .catch(() => cachedResponse)
  
  return cachedResponse || fetchPromise
}

// Helper functions
function isStaticFile(pathname) {
  return pathname.includes('.') || STATIC_FILES.includes(pathname)
}

function isAPIRequest(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(pathname))
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-transactions') {
    event.waitUntil(syncTransactions())
  }
})

async function syncTransactions() {
  try {
    // Get pending transactions from IndexedDB
    const pendingTransactions = await getPendingTransactions()
    
    for (const transaction of pendingTransactions) {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transaction)
        })
        
        if (response.ok) {
          await removePendingTransaction(transaction.id)
        }
      } catch (error) {
        console.error('Failed to sync transaction:', error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'gaegyebu-notification',
    actions: [
      {
        action: 'view',
        title: '보기',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: '닫기',
        icon: '/icon-close.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('가계부', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Placeholder functions for IndexedDB operations
async function getPendingTransactions() {
  // Implementation would use IndexedDB to store offline transactions
  return []
}

async function removePendingTransaction(id) {
  // Implementation would remove transaction from IndexedDB
  console.log('Removing pending transaction:', id)
}