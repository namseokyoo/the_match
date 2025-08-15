// Service Worker - The Match PWA
const CACHE_NAME = 'the-match-v1.0.0';
const DYNAMIC_CACHE = 'the-match-dynamic-v1.0.0';

// 캐시할 정적 자원들
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
];

// 캐시하지 않을 경로들
const CACHE_EXCLUDE = [
  '/api/',
  '/_next/webpack-hmr',
  '/__nextjs',
  '/auth/',
  '.hot-update.'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.error('[SW] Error during install:', err))
  );
  // 즉시 활성화
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return cacheName.startsWith('the-match-') && 
                   cacheName !== CACHE_NAME && 
                   cacheName !== DYNAMIC_CACHE;
          })
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  // 즉시 클라이언트 제어
  self.clients.claim();
});

// Fetch 이벤트
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // chrome-extension 등 지원하지 않는 스킴 필터링
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 캐시 제외 경로 체크
  if (CACHE_EXCLUDE.some(path => url.pathname.includes(path))) {
    return;
  }

  // GET 요청만 캐시
  if (request.method !== 'GET') {
    return;
  }

  // HTML 요청 (네비게이션)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 성공 응답 캐시
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 오프라인 시 캐시된 페이지 반환
          return caches.match(request)
            .then(response => response || caches.match('/offline.html'));
        })
    );
    return;
  }

  // 정적 자원 요청
  if (request.destination === 'image' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request).then(response => {
            // 성공 응답만 캐시
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
        .catch(err => {
          console.error('[SW] Fetch failed:', err);
        })
    );
    return;
  }

  // API 요청 - 네트워크 우선, 실패 시 캐시
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 성공 응답 캐시 (GET 요청만)
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 오프라인 시 캐시된 데이터 반환
          return caches.match(request);
        })
    );
    return;
  }

  // 기본: 네트워크 우선, 캐시 폴백
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncScores());
  }
});

// 점수 동기화 함수
async function syncScores() {
  try {
    // IndexedDB에서 대기 중인 점수 가져오기
    const pendingScores = await getPendingScores();
    
    for (const score of pendingScores) {
      try {
        const response = await fetch('/api/matches/sync-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(score)
        });
        
        if (response.ok) {
          await removePendingScore(score.id);
        }
      } catch (err) {
        console.error('[SW] Score sync failed:', err);
      }
    }
  } catch (err) {
    console.error('[SW] Sync error:', err);
  }
}

// IndexedDB 헬퍼 함수들
async function getPendingScores() {
  // IndexedDB에서 대기 중인 점수 조회
  return [];
}

async function removePendingScore(id) {
  // IndexedDB에서 동기화된 점수 제거
}

// 푸시 알림
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: data.url || '/'
    },
    actions: [
      {
        action: 'explore',
        title: '자세히 보기',
        icon: '/favicon-32x32.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/favicon-32x32.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 알림 클릭
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// 주기적 백그라운드 동기화 (실험적 기능)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-scores') {
    event.waitUntil(updateScores());
  }
});

async function updateScores() {
  // 주기적으로 점수 업데이트 체크
  console.log('[SW] Periodic score update check');
}