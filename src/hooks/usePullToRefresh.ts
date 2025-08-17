'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
    onRefresh: () => Promise<void>;
    threshold?: number;
    enabled?: boolean;
}

export function usePullToRefresh({
    onRefresh,
    threshold = 80,
    enabled = true
}: UsePullToRefreshOptions) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number>(0);
    const isPulling = useRef<boolean>(false);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enabled || isRefreshing) return;
        
        const touch = e.touches[0];
        startY.current = touch.clientY;
        
        // 스크롤이 맨 위에 있을 때만 pull 시작
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            isPulling.current = true;
        }
    }, [enabled, isRefreshing]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isPulling.current || !enabled || isRefreshing) return;
        
        const touch = e.touches[0];
        const deltaY = touch.clientY - startY.current;
        
        if (deltaY > 0) {
            e.preventDefault();
            // 당기는 거리에 따라 저항 적용
            const resistance = Math.min(deltaY * 0.5, threshold * 1.5);
            setPullDistance(resistance);
        }
    }, [enabled, isRefreshing, threshold]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling.current || !enabled) return;
        
        isPulling.current = false;
        
        if (pullDistance >= threshold) {
            setIsRefreshing(true);
            setPullDistance(threshold);
            
            try {
                await onRefresh();
            } catch (error) {
                console.error('Refresh failed:', error);
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [enabled, onRefresh, pullDistance, threshold]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !enabled) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

    return {
        containerRef,
        isRefreshing,
        pullDistance,
        threshold
    };
}

