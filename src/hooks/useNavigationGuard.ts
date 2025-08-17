'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UseNavigationGuardOptions {
    enabled?: boolean;
    message?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

/**
 * 페이지 이탈 시 확인 모달을 표시하는 훅
 */
export function useNavigationGuard({
    enabled = true,
    message = '저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?',
    onConfirm,
    onCancel
}: UseNavigationGuardOptions = {}) {
    const router = useRouter();
    const pathname = usePathname();
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

    // 브라우저 뒤로가기/앞으로가기 감지
    useEffect(() => {
        if (!enabled) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = message;
            return message;
        };

        // popstate 이벤트 처리 (브라우저 뒤로가기/앞으로가기)
        const handlePopState = (e: PopStateEvent) => {
            if (enabled) {
                e.preventDefault();
                
                // 현재 URL을 다시 push하여 뒤로가기를 취소
                window.history.pushState(null, '', window.location.href);
                
                setShowConfirm(true);
                setPendingNavigation('back');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);

        // 초기 상태 설정
        window.history.pushState(null, '', window.location.href);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [enabled, message]);

    // 프로그래매틱 네비게이션 감지
    const navigate = useCallback((href: string) => {
        if (!enabled) {
            router.push(href);
            return;
        }

        setShowConfirm(true);
        setPendingNavigation(href);
    }, [enabled, router]);

    // 확인 처리
    const handleConfirm = useCallback(() => {
        setShowConfirm(false);
        
        if (onConfirm) {
            onConfirm();
        }

        if (pendingNavigation === 'back') {
            window.history.back();
        } else if (pendingNavigation) {
            router.push(pendingNavigation);
        }

        setPendingNavigation(null);
    }, [pendingNavigation, router, onConfirm]);

    // 취소 처리
    const handleCancel = useCallback(() => {
        setShowConfirm(false);
        setPendingNavigation(null);
        
        if (onCancel) {
            onCancel();
        }
    }, [onCancel]);

    return {
        showConfirm,
        navigate,
        handleConfirm,
        handleCancel,
        isNavigating: pendingNavigation !== null
    };
}

/**
 * 폼 변경사항 추적 훅
 */
export function useFormChanges() {
    const [hasChanges, setHasChanges] = useState(false);
    const [initialValues, setInitialValues] = useState<any>(null);

    const trackChanges = useCallback((currentValues: any) => {
        if (!initialValues) {
            setInitialValues(currentValues);
            return;
        }

        const changed = JSON.stringify(currentValues) !== JSON.stringify(initialValues);
        setHasChanges(changed);
    }, [initialValues]);

    const resetChanges = useCallback(() => {
        setHasChanges(false);
        setInitialValues(null);
    }, []);

    const saveChanges = useCallback((newValues: any) => {
        setInitialValues(newValues);
        setHasChanges(false);
    }, []);

    return {
        hasChanges,
        trackChanges,
        resetChanges,
        saveChanges
    };
}