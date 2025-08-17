import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

/**
 * 인증이 필요한 페이지에서 사용하는 Hook
 * 로그인하지 않은 사용자를 자동으로 로그인 페이지로 리다이렉트
 * @param redirectTo - 리다이렉트할 경로 (기본값: '/login')
 * @returns { user, loading } - 현재 사용자와 로딩 상태
 */
export function useRequireAuth(redirectTo: string = '/login') {
    const { user, loading } = useAuth();
    const router = useRouter();
    const hasRedirected = useRef(false);

    useEffect(() => {
        // 로딩이 완료되고 사용자가 없으면 리다이렉트
        // hasRedirected를 사용하여 중복 리다이렉트 방지
        if (!loading && !user && !hasRedirected.current) {
            console.log('[useRequireAuth] Redirecting to login - no user detected');
            hasRedirected.current = true;
            
            // 현재 경로를 redirectTo 파라미터로 추가
            const currentPath = window.location.pathname;
            const loginUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`;
            router.push(loginUrl);
        }
        
        // 사용자가 로그인하면 플래그 리셋
        if (user && hasRedirected.current) {
            hasRedirected.current = false;
        }
    }, [loading, user, router, redirectTo]);

    return { user, loading };
}

/**
 * 이미 로그인한 사용자가 접근하면 안되는 페이지에서 사용하는 Hook
 * 로그인한 사용자를 자동으로 대시보드로 리다이렉트
 * @param redirectTo - 리다이렉트할 경로 (기본값: '/dashboard')
 * @returns { user, loading } - 현재 사용자와 로딩 상태
 */
export function useRequireGuest(redirectTo: string = '/dashboard') {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // 로딩이 완료되고 사용자가 있으면 리다이렉트
        if (!loading && user) {
            router.push(redirectTo);
        }
    }, [loading, user, router, redirectTo]);

    return { user, loading };
}