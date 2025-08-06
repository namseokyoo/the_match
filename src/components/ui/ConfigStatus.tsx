'use client';

import React, { useEffect, useState } from 'react';
import { configValidator, ValidationResult } from '@/lib/config-validator';

interface ConfigStatusProps {
    className?: string;
    showDetails?: boolean;
    onClose?: () => void;
}

/**
 * 환경 설정 상태를 표시하는 컴포넌트
 * 
 * 개발 환경에서 자동으로 표시되며, 환경 변수와 Supabase 연결 상태를 확인합니다.
 */
export default function ConfigStatus({ 
    className = '', 
    showDetails = true,
    onClose 
}: ConfigStatusProps) {
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        validateConfig();
    }, []);

    const validateConfig = async () => {
        setIsLoading(true);
        try {
            const result = await configValidator.validateAll();
            setValidationResult(result);
        } catch (error) {
            console.error('환경 설정 검증 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 프로덕션 환경에서는 표시하지 않음
    if (process.env.NODE_ENV === 'production' && validationResult?.isValid) {
        return null;
    }

    // 로딩 중
    if (isLoading) {
        return (
            <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">환경 설정 확인 중...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!validationResult) return null;

    // 최소화된 상태
    if (isMinimized) {
        return (
            <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
                <button
                    onClick={() => setIsMinimized(false)}
                    className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg border
                        ${validationResult.isValid 
                            ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                            : 'bg-red-50 border-red-200 hover:bg-red-100'
                        }
                        transition-colors
                    `}
                >
                    <span className="text-2xl">
                        {validationResult.isValid ? '✅' : '❌'}
                    </span>
                    <span className="text-sm font-medium">
                        환경 설정 {validationResult.isValid ? '정상' : '오류'}
                    </span>
                </button>
            </div>
        );
    }

    // 전체 상태 표시
    return (
        <div className={`fixed bottom-4 right-4 z-50 max-w-md ${className}`}>
            <div className={`
                bg-white rounded-lg shadow-xl border-2
                ${validationResult.isValid ? 'border-green-200' : 'border-red-200'}
            `}>
                {/* 헤더 */}
                <div className={`
                    flex items-center justify-between p-4 border-b
                    ${validationResult.isValid ? 'bg-green-50' : 'bg-red-50'}
                `}>
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                            {validationResult.isValid ? '✅' : '❌'}
                        </span>
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                환경 설정 {validationResult.isValid ? '정상' : '오류'}
                            </h3>
                            <p className="text-xs text-gray-600">
                                {validationResult.environment} 환경
                            </p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="text-gray-400 hover:text-gray-600"
                            title="최소화"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
                                title="닫기"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Supabase 연결 상태 */}
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Supabase 연결</span>
                        <span className={`
                            text-xs px-2 py-1 rounded-full
                            ${validationResult.supabaseStatus.isConnected 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }
                        `}>
                            {validationResult.supabaseStatus.isConnected ? '연결됨' : '연결 실패'}
                        </span>
                    </div>
                    {validationResult.supabaseStatus.isConnected && (
                        <div className="text-xs text-gray-600 space-y-1">
                            <div>응답 시간: {validationResult.supabaseStatus.latency}ms</div>
                            <div className="truncate">URL: {validationResult.supabaseStatus.projectUrl}</div>
                        </div>
                    )}
                    {validationResult.supabaseStatus.error && (
                        <div className="mt-2 text-xs text-red-600">
                            {validationResult.supabaseStatus.error}
                        </div>
                    )}
                </div>

                {/* 오류 목록 */}
                {validationResult.errors.length > 0 && (
                    <div className="p-4 border-b">
                        <h4 className="text-sm font-medium text-red-800 mb-2">
                            오류 ({validationResult.errors.length})
                        </h4>
                        <div className="space-y-2">
                            {validationResult.errors.map((error, index) => (
                                <div key={index} className="bg-red-50 rounded p-2">
                                    <div className="text-xs font-medium text-red-800">
                                        {error.field}
                                    </div>
                                    <div className="text-xs text-red-600 mt-1">
                                        {error.message}
                                    </div>
                                    {error.hint && (
                                        <div className="text-xs text-gray-600 mt-1">
                                            💡 {error.hint}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 경고 목록 */}
                {validationResult.warnings.length > 0 && showDetails && (
                    <div className="p-4 border-b">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">
                            경고 ({validationResult.warnings.length})
                        </h4>
                        <div className="space-y-2">
                            {validationResult.warnings.map((warning, index) => (
                                <div key={index} className="bg-yellow-50 rounded p-2">
                                    <div className="text-xs font-medium text-yellow-800">
                                        {warning.field}
                                    </div>
                                    <div className="text-xs text-yellow-600 mt-1">
                                        {warning.message}
                                    </div>
                                    {warning.hint && (
                                        <div className="text-xs text-gray-600 mt-1">
                                            💡 {warning.hint}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 액션 버튼 */}
                <div className="p-4 bg-gray-50">
                    <div className="flex space-x-2">
                        <button
                            onClick={validateConfig}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                            다시 확인
                        </button>
                        {!validationResult.isValid && (
                            <a
                                href="https://github.com/namseokyoo/the_match#환경-설정"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors text-center"
                            >
                                설정 가이드
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}