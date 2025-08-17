'use client';

import React from 'react';
import { X, AlertCircle, RefreshCw, Home, LogIn } from 'lucide-react';
import { getErrorMessage, getErrorActions, type ErrorAction, type ErrorInput } from '@/utils/error-messages';
import Button from './Button';

interface ErrorToastProps {
  error: ErrorInput;
  onClose: () => void;
  onRetry?: () => void;
}

export default function ErrorToast({ error, onClose, onRetry }: ErrorToastProps) {
  const message = getErrorMessage(error);
  const actions = getErrorActions(error);
  
  // 에러 타입에 따른 아이콘 색상
  const getIconColor = () => {
    const errorObj = error as any;
    if (errorObj?.status === 401 || errorObj?.message?.includes('auth')) {
      return 'text-yellow-500';
    }
    if (errorObj?.status >= 500 || errorObj?.message?.includes('server')) {
      return 'text-red-500';
    }
    return 'text-orange-500';
  };
  
  // 액션 아이콘 선택
  const getActionIcon = (action: ErrorAction) => {
    if (action.label === '다시 로그인') return <LogIn className="w-4 h-4" />;
    if (action.label === '새로고침' || action.label === '다시 시도') return <RefreshCw className="w-4 h-4" />;
    if (action.label === '홈으로') return <Home className="w-4 h-4" />;
    return null;
  };
  
  return (
    <div className="fixed bottom-4 right-4 max-w-md w-full bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getIconColor()}`} />
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">오류 발생</h3>
          <p className="text-sm text-gray-600 mb-3">{message}</p>
          
          {/* 액션 버튼들 */}
          {actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant || 'outline'}
                  onClick={() => {
                    action.action();
                    onClose();
                  }}
                  className="text-xs"
                >
                  {getActionIcon(action)}
                  <span>{action.label}</span>
                </Button>
              ))}
              
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onRetry();
                    onClose();
                  }}
                  className="text-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>재시도</span>
                </Button>
              )}
            </div>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      
      {/* 디버그 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (error as any)?.stack && (
        <details className="mt-3 pt-3 border-t border-gray-200">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            개발자 정보
          </summary>
          <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-32 bg-gray-50 p-2 rounded">
            {(error as any).stack}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * 에러 토스트를 표시하는 유틸리티 함수
 */
export function showErrorToast(error: ErrorInput, options?: { onRetry?: () => void }) {
  // 토스트 컨테이너가 없으면 생성
  let container = document.getElementById('error-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'error-toast-container';
    document.body.appendChild(container);
  }
  
  // React 컴포넌트를 렌더링
  const root = document.createElement('div');
  container.appendChild(root);
  
  // 자동으로 5초 후 제거 (에러가 심각하면 10초)
  const duration = (error as any)?.status >= 500 ? 10000 : 5000;
  const timer = setTimeout(() => {
    root.remove();
  }, duration);
  
  // 수동 닫기 함수
  const handleClose = () => {
    clearTimeout(timer);
    root.remove();
  };
  
  // React 18의 createRoot 사용
  import('react-dom/client').then(({ createRoot }) => {
    const reactRoot = createRoot(root);
    reactRoot.render(
      <ErrorToast
        error={error}
        onClose={handleClose}
        onRetry={options?.onRetry}
      />
    );
  });
}