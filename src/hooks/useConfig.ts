'use client';

import { useState, useEffect } from 'react';
import { ValidationResult } from '@/lib/config-validator';

/**
 * 환경 설정 상태를 확인하는 Hook
 * 
 * @example
 * ```tsx
 * const { isValid, isLoading, errors, supabaseStatus, refresh } = useConfig();
 * 
 * if (!isValid) {
 *   return <ConfigError errors={errors} />;
 * }
 * ```
 */
export function useConfig() {
    const [result, setResult] = useState<ValidationResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchConfig = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/config/validate');
            
            if (!response.ok) {
                throw new Error('설정 검증 API 호출 실패');
            }
            
            const data = await response.json();
            
            if (data.result) {
                setResult(data.result);
            }
        } catch (err) {
            console.error('설정 확인 실패:', err);
            setError(err instanceof Error ? err : new Error('알 수 없는 오류'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return {
        isValid: result?.isValid ?? false,
        isLoading,
        error,
        errors: result?.errors ?? [],
        warnings: result?.warnings ?? [],
        supabaseStatus: result?.supabaseStatus ?? {
            isConnected: false,
            isHealthy: false,
        },
        environment: result?.environment ?? 'development',
        refresh: fetchConfig,
    };
}