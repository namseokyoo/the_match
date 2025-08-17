'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
    onLoadMore: () => Promise<void>;
    hasMore: boolean;
    threshold?: number;
    enabled?: boolean;
}

export function useInfiniteScroll({
    onLoadMore,
    hasMore,
    threshold = 100,
    enabled = true
}: UseInfiniteScrollOptions) {
    const [isLoading, setIsLoading] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const handleLoadMore = useCallback(async () => {
        if (isLoading || !hasMore || !enabled) return;
        
        setIsLoading(true);
        try {
            await onLoadMore();
        } catch (error) {
            console.error('Load more failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, enabled, onLoadMore]);

    useEffect(() => {
        if (!enabled) return;

        const options: IntersectionObserverInit = {
            root: null,
            rootMargin: `${threshold}px`,
            threshold: 0.1
        };

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasMore && !isLoading) {
                    handleLoadMore();
                }
            },
            options
        );

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [enabled, hasMore, isLoading, threshold, handleLoadMore]);

    return {
        sentinelRef,
        isLoading,
        hasMore
    };
}


// 페이지네이션 훅 (무한 스크롤과 함께 사용)
export function usePagination<T>(
    items: T[],
    pageSize: number = 10
) {
    const [page, setPage] = useState(1);
    const [allItems, setAllItems] = useState<T[]>([]);

    useEffect(() => {
        setAllItems(items.slice(0, page * pageSize));
    }, [items, page, pageSize]);

    const loadMore = useCallback(async () => {
        // 시뮬레이션된 지연
        await new Promise(resolve => setTimeout(resolve, 500));
        setPage(prev => prev + 1);
    }, []);

    const hasMore = allItems.length < items.length;

    const reset = useCallback(() => {
        setPage(1);
        setAllItems(items.slice(0, pageSize));
    }, [items, pageSize]);

    return {
        items: allItems,
        loadMore,
        hasMore,
        reset,
        page,
        totalPages: Math.ceil(items.length / pageSize)
    };
}