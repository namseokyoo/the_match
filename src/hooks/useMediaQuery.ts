import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // 초기값 설정
    setMatches(media.matches);

    // 리스너 함수
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 이벤트 리스너 등록
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // 구형 브라우저 지원
      media.addListener(listener);
    }

    // 클린업
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        // 구형 브라우저 지원
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

// 편의 함수들
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}