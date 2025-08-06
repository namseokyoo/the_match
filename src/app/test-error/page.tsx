'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { useAsyncError } from '@/components/ui/ErrorBoundary';

/**
 * ErrorBoundary 테스트 페이지
 * 개발 환경에서 에러 바운더리가 올바르게 작동하는지 확인하기 위한 페이지
 */
export default function TestErrorPage() {
    const [shouldThrowError, setShouldThrowError] = useState(false);
    const throwAsyncError = useAsyncError();

    // 동기 에러 발생
    if (shouldThrowError) {
        throw new Error('테스트 에러: 이것은 의도적으로 발생시킨 에러입니다.');
    }

    // 비동기 에러 발생
    const handleAsyncError = () => {
        setTimeout(() => {
            throwAsyncError(new Error('비동기 테스트 에러: 이것은 비동기로 발생한 에러입니다.'));
        }, 1000);
    };

    // Promise rejection 에러
    const handlePromiseError = async () => {
        try {
            await new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Promise 거부 에러: 이것은 Promise rejection 에러입니다.'));
                }, 1000);
            });
        } catch (error) {
            throwAsyncError(error as Error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Error Boundary 테스트 페이지
                    </h1>
                    
                    <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800">
                            ⚠️ 이 페이지는 개발 환경에서 ErrorBoundary 컴포넌트를 테스트하기 위한 페이지입니다.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">
                                동기 에러 테스트
                            </h2>
                            <p className="text-gray-600 mb-4">
                                버튼을 클릭하면 즉시 에러가 발생하고 ErrorBoundary가 이를 포착합니다.
                            </p>
                            <Button
                                onClick={() => setShouldThrowError(true)}
                                variant="destructive"
                                size="md"
                            >
                                동기 에러 발생시키기
                            </Button>
                        </div>

                        <div className="border-t pt-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">
                                비동기 에러 테스트
                            </h2>
                            <p className="text-gray-600 mb-4">
                                버튼을 클릭하고 1초 후에 비동기 에러가 발생합니다.
                            </p>
                            <Button
                                onClick={handleAsyncError}
                                variant="destructive"
                                size="md"
                            >
                                비동기 에러 발생시키기 (1초 후)
                            </Button>
                        </div>

                        <div className="border-t pt-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">
                                Promise Rejection 테스트
                            </h2>
                            <p className="text-gray-600 mb-4">
                                Promise가 거부되면 ErrorBoundary가 이를 포착합니다.
                            </p>
                            <Button
                                onClick={handlePromiseError}
                                variant="destructive"
                                size="md"
                            >
                                Promise Rejection 발생시키기
                            </Button>
                        </div>

                        <div className="border-t pt-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">
                                ErrorBoundary 기능
                            </h2>
                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                                <li>자식 컴포넌트의 JavaScript 에러 포착</li>
                                <li>에러 로그 콘솔 출력</li>
                                <li>사용자 친화적인 대체 UI 표시</li>
                                <li>에러 상태 리셋 기능 ('다시 시도' 버튼)</li>
                                <li>개발 환경에서 에러 상세 정보 표시</li>
                                <li>프로덕션 환경에서는 간단한 에러 메시지만 표시</li>
                                <li>비동기 에러 처리를 위한 useAsyncError Hook</li>
                            </ul>
                        </div>

                        <div className="border-t pt-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">
                                참고 사항
                            </h2>
                            <div className="space-y-2 text-gray-600">
                                <p>
                                    • ErrorBoundary는 이벤트 핸들러 내부의 에러를 포착하지 못합니다.
                                </p>
                                <p>
                                    • 비동기 코드에서 발생하는 에러는 useAsyncError Hook을 사용해야 합니다.
                                </p>
                                <p>
                                    • 서버 사이드 렌더링 중 발생하는 에러는 포착하지 못합니다.
                                </p>
                                <p>
                                    • ErrorBoundary 자체에서 발생하는 에러는 포착할 수 없습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}