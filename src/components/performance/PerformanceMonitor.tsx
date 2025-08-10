'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Zap, HardDrive, Wifi, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
    fps: number;
    memory: number;
    loadTime: number;
    networkLatency: number;
    cacheHitRate: number;
}

export const PerformanceMonitor: React.FC<{ show?: boolean }> = ({ show = false }) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        fps: 60,
        memory: 0,
        loadTime: 0,
        networkLatency: 0,
        cacheHitRate: 0,
    });
    const [isVisible, setIsVisible] = useState(show);

    useEffect(() => {
        if (!isVisible) return;

        let frameCount = 0;
        let lastTime = performance.now();
        let rafId: number;

        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;
                
                // 메모리 사용량 측정 (Chrome only)
                const memory = (performance as any).memory
                    ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
                    : 0;
                
                // 네트워크 지연 측정
                const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                const networkLatency = navTiming
                    ? Math.round(navTiming.responseEnd - navTiming.fetchStart)
                    : 0;
                
                // 페이지 로드 시간
                const loadTime = navTiming
                    ? Math.round(navTiming.loadEventEnd - navTiming.fetchStart)
                    : 0;
                
                setMetrics(prev => ({
                    ...prev,
                    fps,
                    memory,
                    networkLatency,
                    loadTime,
                }));
            }
            
            rafId = requestAnimationFrame(measureFPS);
        };

        rafId = requestAnimationFrame(measureFPS);

        return () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [isVisible]);

    // 캐시 히트율 측정
    useEffect(() => {
        if (!isVisible) return;

        const measureCacheHitRate = () => {
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
            const cached = resources.filter(r => r.transferSize === 0 && r.decodedBodySize > 0);
            const hitRate = resources.length > 0
                ? Math.round((cached.length / resources.length) * 100)
                : 0;
            
            setMetrics(prev => ({ ...prev, cacheHitRate: hitRate }));
        };

        measureCacheHitRate();
        const interval = setInterval(measureCacheHitRate, 5000);

        return () => clearInterval(interval);
    }, [isVisible]);

    const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
        if (value >= thresholds.good) return 'text-green-600';
        if (value >= thresholds.warning) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getFPSColor = () => getStatusColor(metrics.fps, { good: 50, warning: 30 });
    const getMemoryColor = () => {
        if (metrics.memory < 50) return 'text-green-600';
        if (metrics.memory < 100) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 right-4 p-2 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 z-50"
                title="성능 모니터 열기"
            >
                <Activity className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">성능 모니터</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-400 hover:text-gray-600"
                >
                    &times;
                </button>
            </div>

            <div className="space-y-3">
                {/* FPS */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">FPS</span>
                    </div>
                    <span className={`text-sm font-mono font-semibold ${getFPSColor()}`}>
                        {metrics.fps}
                    </span>
                </div>

                {/* 메모리 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <HardDrive className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">메모리</span>
                    </div>
                    <span className={`text-sm font-mono font-semibold ${getMemoryColor()}`}>
                        {metrics.memory} MB
                    </span>
                </div>

                {/* 네트워크 지연 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Wifi className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">네트워크</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-gray-700">
                        {metrics.networkLatency} ms
                    </span>
                </div>

                {/* 캐시 히트율 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">캐시 히트</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-gray-700">
                        {metrics.cacheHitRate}%
                    </span>
                </div>

                {/* 로드 시간 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">로드 시간</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-gray-700">
                        {metrics.loadTime} ms
                    </span>
                </div>
            </div>

            {/* 경고 메시지 */}
            {metrics.fps < 30 && (
                <div className="mt-3 p-2 bg-red-50 rounded-md">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-xs text-red-600">
                            낮은 FPS가 감지되었습니다
                        </span>
                    </div>
                </div>
            )}

            {metrics.memory > 100 && (
                <div className="mt-3 p-2 bg-yellow-50 rounded-md">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs text-yellow-600">
                            메모리 사용량이 높습니다
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

// 성능 최적화 유틸리티 함수들
export const performanceUtils = {
    // 디바운스
    debounce: <T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): ((...args: Parameters<T>) => void) => {
        let timeout: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    },

    // 쓰로틀
    throttle: <T extends (...args: any[]) => any>(
        func: T,
        limit: number
    ): ((...args: Parameters<T>) => void) => {
        let inThrottle: boolean;
        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    },

    // 메모이제이션
    memoize: <T extends (...args: any[]) => any>(func: T) => {
        const cache = new Map();
        return ((...args: Parameters<T>): ReturnType<T> => {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = func(...args);
            cache.set(key, result);
            return result;
        }) as T;
    },

    // 지연 로딩
    lazyLoad: (importFunc: () => Promise<any>) => {
        let module: any = null;
        return async () => {
            if (!module) {
                module = await importFunc();
            }
            return module;
        };
    },

    // 가상 스크롤링을 위한 아이템 계산
    calculateVisibleItems: <T>(
        items: T[],
        scrollTop: number,
        containerHeight: number,
        itemHeight: number,
        buffer: number = 5
    ) => {
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
        const endIndex = Math.min(
            items.length,
            Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
        );
        
        return {
            visibleItems: items.slice(startIndex, endIndex),
            startIndex,
            endIndex,
            totalHeight: items.length * itemHeight,
        };
    },
};

export default PerformanceMonitor;