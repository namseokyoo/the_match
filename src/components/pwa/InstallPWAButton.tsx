'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui';

export default function InstallPWAButton() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // PWA 설치 상태 체크
    const checkInstallState = () => {
      // iOS Safari 체크
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isInStandaloneMode = ('standalone' in window.navigator) && 
                                 ((window.navigator as any).standalone);
      
      // 일반 PWA 체크
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.matchMedia('(display-mode: fullscreen)').matches ||
                          isInStandaloneMode;

      setIsInstalled(isStandalone);

      // 설치 가능 상태 체크
      if (!isStandalone) {
        if (isIOS && !isInStandaloneMode) {
          // iOS는 항상 수동 설치 안내
          setIsInstallable(true);
        } else if ((window as any).isInstallable) {
          setIsInstallable(true);
        }

        // 배너 표시 (처음 방문 후 30초 뒤)
        if (!localStorage.getItem('pwa-banner-shown')) {
          setTimeout(() => {
            setShowBanner(true);
            localStorage.setItem('pwa-banner-shown', 'true');
          }, 30000);
        }
      }
    };

    checkInstallState();

    // 전역 이벤트 리스너
    const handleInstallableChange = () => {
      setIsInstallable((window as any).isInstallable);
    };

    window.addEventListener('installable-change', handleInstallableChange);
    
    return () => {
      window.removeEventListener('installable-change', handleInstallableChange);
    };
  }, []);

  const handleInstall = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // iOS 설치 안내 모달 표시
      showIOSInstallGuide();
    } else if ((window as any).installPWA) {
      (window as any).installPWA();
    }
  };

  const showIOSInstallGuide = () => {
    // iOS 설치 가이드 모달
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center';
    modal.innerHTML = `
      <div class="bg-white rounded-t-2xl p-6 w-full max-w-md animate-slide-up">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-bold">앱 설치 방법</h3>
          <button onclick="this.closest('.fixed').remove()" class="p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ol class="space-y-3 text-sm">
          <li class="flex items-start gap-3">
            <span class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>하단의 공유 버튼 <svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 6.414V13a1 1 0 11-2 0V6.414L7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z"/><path d="M3 11a1 1 0 011 1v5a1 1 0 001 1h10a1 1 0 001-1v-5a1 1 0 112 0v5a3 3 0 01-3 3H5a3 3 0 01-3-3v-5a1 1 0 011-1z"/></svg> 을 탭하세요</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>"홈 화면에 추가"를 선택하세요</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>오른쪽 상단의 "추가"를 탭하세요</span>
          </li>
        </ol>
        <button onclick="this.closest('.fixed').remove()" class="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-medium">
          확인
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  };

  if (isInstalled) {
    return null; // 이미 설치됨
  }

  return (
    <>
      {/* 플로팅 설치 버튼 (모바일) */}
      {isInstallable && !showBanner && (
        <button
          onClick={handleInstall}
          className="fixed bottom-20 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-40 lg:hidden animate-bounce"
          aria-label="앱 설치"
        >
          <Download className="w-5 h-5" />
        </button>
      )}

      {/* 설치 배너 */}
      {showBanner && isInstallable && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 p-4 animate-slide-up">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">The Match 앱으로 설치</p>
                <p className="text-sm text-gray-600">더 빠르고 편리하게 이용하세요</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleInstall}
              >
                설치
              </Button>
              <button
                onClick={() => setShowBanner(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 데스크톱 설치 버튼 (네비게이션 바에 표시) */}
      {isInstallable && (
        <div className="hidden lg:block">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleInstall}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            앱 설치
          </Button>
        </div>
      )}
    </>
  );
}