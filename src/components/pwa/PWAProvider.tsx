'use client';

import { useEffect, useState } from 'react';
import { showToast } from '@/components/ui/Toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Service Worker 등록
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered:', reg);
          setRegistration(reg);

          // 업데이트 체크
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showToast('새 버전이 있습니다. 새로고침하여 업데이트하세요.', 'info');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // PWA 설치 프롬프트 캐치
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // 설치 가능 알림 (한 번만)
      if (!localStorage.getItem('pwa-install-prompted')) {
        setTimeout(() => {
          showToast('앱으로 설치하여 더 빠르게 이용하세요!', 'info');
          localStorage.setItem('pwa-install-prompted', 'true');
        }, 3000);
      }
    };

    // 앱 설치 완료 감지
    const handleAppInstalled = () => {
      console.log('PWA installed successfully');
      setDeferredPrompt(null);
      setIsInstallable(false);
      showToast('앱이 성공적으로 설치되었습니다!', 'success');
    };

    // 온라인/오프라인 상태 감지
    const handleOnline = () => {
      setIsOnline(true);
      showToast('온라인 연결이 복구되었습니다', 'success');
      
      // 백그라운드 동기화 트리거
      if (registration && 'sync' in registration) {
        (registration as any).sync.register('sync-scores').catch(console.error);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('오프라인 모드입니다. 데이터가 나중에 동기화됩니다.', 'warning');
    };

    // 이벤트 리스너 등록
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 초기 온라인 상태 체크
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [registration]);

  // 푸시 알림 권한 요청
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToast('알림이 활성화되었습니다', 'success');
        return true;
      }
    }

    return false;
  };

  // 푸시 알림 구독
  const subscribeToPushNotifications = async () => {
    if (!registration) return;

    try {
      const permission = await requestNotificationPermission();
      if (!permission) return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      // 서버에 구독 정보 전송
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      showToast('푸시 알림이 활성화되었습니다', 'success');
    } catch (error) {
      console.error('Push subscription failed:', error);
      showToast('푸시 알림 활성화에 실패했습니다', 'error');
    }
  };

  // PWA 설치 프롬프트 표시
  const installPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted PWA install');
    } else {
      console.log('User dismissed PWA install');
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Context value로 제공할 수도 있음
  useEffect(() => {
    // PWA 관련 전역 함수 등록
    (window as any).installPWA = installPWA;
    (window as any).subscribeToPushNotifications = subscribeToPushNotifications;
    (window as any).isOnline = isOnline;
    (window as any).isInstallable = isInstallable;
  }, [deferredPrompt, isOnline, isInstallable]);

  return <>{children}</>;
}