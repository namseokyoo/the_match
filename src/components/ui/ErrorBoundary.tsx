'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    // eslint-disable-next-line no-unused-vars
    fallback?: (error: Error, resetError: () => void) => ReactNode;
    // eslint-disable-next-line no-unused-vars
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary 컴포넌트
 * 
 * 자식 컴포넌트에서 발생하는 JavaScript 에러를 포착하고,
 * 에러 로그를 남기며, 전체 컴포넌트 트리 대신 대체 UI를 표시합니다.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 * 
 * @example 커스텀 에러 UI
 * ```tsx
 * <ErrorBoundary 
 *   fallback={(error, reset) => <CustomErrorUI error={error} onReset={reset} />}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        // 다음 렌더링에서 대체 UI를 표시하기 위해 state를 업데이트합니다.
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // 에러 로깅 서비스에 에러를 기록할 수 있습니다.
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        // 에러 정보를 state에 저장
        this.setState({
            errorInfo,
        });

        // 부모 컴포넌트에 에러 정보 전달
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // 프로덕션 환경에서는 외부 에러 추적 서비스로 전송
        if (process.env.NODE_ENV === 'production') {
            // 예: Sentry, LogRocket 등으로 에러 전송
            // logErrorToService(error, errorInfo);
        }
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            // 커스텀 대체 UI가 제공된 경우
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.resetError);
            }

            // 기본 대체 UI
            return (
                <div className="min-h-[400px] flex items-center justify-center p-4">
                    <div className="max-w-md w-full">
                        <div className="bg-white rounded-lg shadow-lg border border-red-100 p-6 text-center">
                            {/* 에러 아이콘 */}
                            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                                <svg 
                                    className="w-8 h-8 text-red-600" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                                    />
                                </svg>
                            </div>

                            {/* 에러 메시지 */}
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                문제가 발생했습니다
                            </h2>
                            <p className="text-gray-600 mb-6">
                                예상치 못한 오류가 발생했습니다. 
                                불편을 드려 죄송합니다.
                            </p>

                            {/* 개발 환경에서만 에러 상세 정보 표시 */}
                            {process.env.NODE_ENV === 'development' && (
                                <details className="mb-6 text-left">
                                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 transition-colors">
                                        에러 상세 정보 (개발 모드)
                                    </summary>
                                    <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                                        <p className="text-xs font-mono text-red-600 mb-2">
                                            {this.state.error.toString()}
                                        </p>
                                        {this.state.errorInfo && (
                                            <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        )}
                                    </div>
                                </details>
                            )}

                            {/* 액션 버튼들 */}
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={this.resetError}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                >
                                    다시 시도
                                </button>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                >
                                    홈으로
                                </button>
                            </div>
                        </div>

                        {/* 추가 도움말 */}
                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-500">
                                문제가 계속되면{' '}
                                <a 
                                    href="mailto:support@thematch.com" 
                                    className="text-blue-600 hover:underline"
                                >
                                    고객 지원팀
                                </a>
                                에 문의해 주세요.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * 비동기 에러를 처리하기 위한 Hook
 * Error Boundary는 비동기 에러를 포착할 수 없으므로,
 * 이 Hook을 사용하여 비동기 에러를 Error Boundary로 전달합니다.
 * 
 * @example
 * ```tsx
 * const throwError = useAsyncError();
 * 
 * useEffect(() => {
 *   fetchData().catch(throwError);
 * }, []);
 * ```
 */
export function useAsyncError() {
    const [, setError] = React.useState();
    
    return React.useCallback(
        (error: Error) => {
            setError(() => {
                throw error;
            });
        },
        [setError],
    );
}

/**
 * 에러 바운더리와 함께 사용할 수 있는 컨텍스트
 * 하위 컴포넌트에서 에러를 수동으로 트리거할 수 있습니다.
 */
const ErrorBoundaryContext = React.createContext<{
    resetError?: () => void;
    throwError?: (error: Error) => void;
}>({});

export const useErrorBoundary = () => {
    const context = React.useContext(ErrorBoundaryContext);
    return context;
};

/**
 * Context를 제공하는 ErrorBoundary 래퍼
 */
export function ErrorBoundaryProvider({ 
    children, 
    ...props 
}: ErrorBoundaryProps) {
    // eslint-disable-next-line no-unused-vars
    const [error, setError] = React.useState<Error | null>(null);
    const resetError = React.useCallback(() => setError(null), []);
    const throwError = React.useCallback((error: Error) => setError(error), []);

    // 에러가 설정되면 throw
    if (error) {
        throw error;
    }

    return (
        <ErrorBoundary {...props}>
            <ErrorBoundaryContext.Provider value={{ resetError, throwError }}>
                {children}
            </ErrorBoundaryContext.Provider>
        </ErrorBoundary>
    );
}

export default ErrorBoundary;