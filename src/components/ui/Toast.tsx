'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastItem extends ToastProps {
    id: string;
}

// 전역 토스트 리스트
let toastList: ToastItem[] = [];
let updateToasts: ((_toasts: ToastItem[]) => void) | null = null;

export const showToast = (
    message: string, 
    type: ToastProps['type'] = 'info',
    duration: number = 3000,
    action?: ToastProps['action']
) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastItem = { id, message, type, duration, action };
    
    toastList = [...toastList, newToast];
    updateToasts?.(toastList);
    
    // 자동 제거
    if (duration > 0) {
        setTimeout(() => {
            dismissToast(id);
        }, duration);
    }
};

export const dismissToast = (id: string) => {
    toastList = toastList.filter(t => t.id !== id);
    updateToasts?.(toastList);
};

const Toast: React.FC<ToastItem & { onDismiss: () => void }> = ({ 
    message, 
    type = 'info', 
    action,
    onDismiss 
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [progress, setProgress] = useState(100);
    
    useEffect(() => {
        // 애니메이션을 위한 약간의 지연
        setTimeout(() => setIsVisible(true), 10);
        
        // 진행률 애니메이션
        const interval = setInterval(() => {
            setProgress(prev => Math.max(0, prev - 2));
        }, 60);
        
        return () => clearInterval(interval);
    }, []);
    
    const icons = {
        success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
        error: <XCircle className="w-5 h-5 flex-shrink-0" />,
        warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
        info: <Info className="w-5 h-5 flex-shrink-0" />,
    };
    
    const styles = {
        success: 'bg-green-50 text-green-800 border-green-200',
        error: 'bg-red-50 text-red-800 border-red-200',
        warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        info: 'bg-blue-50 text-blue-800 border-blue-200',
    };
    
    const progressStyles = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
    };
    
    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
    };
    
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-lg border shadow-lg',
                'transition-all duration-300 transform',
                'max-w-md w-full',
                styles[type],
                isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'
            )}
        >
            <div className="flex items-start gap-3 p-4">
                <div className="flex-shrink-0">
                    {icons[type]}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium break-words">{message}</p>
                    {action && (
                        <button
                            onClick={action.onClick}
                            className="mt-2 text-sm font-semibold underline hover:no-underline transition-all"
                        >
                            {action.label}
                        </button>
                    )}
                </div>
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 ml-2 p-1 rounded hover:bg-black/5 transition-colors"
                    aria-label="닫기"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            {/* 진행률 표시 바 */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
                <div 
                    className={cn('h-full transition-all duration-100', progressStyles[type])}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    
    useEffect(() => {
        updateToasts = setToasts;
        return () => {
            updateToasts = null;
        };
    }, []);
    
    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none sm:left-auto sm:right-0 sm:bottom-0">
            <div className="flex flex-col items-center sm:items-end gap-3">
                {toasts.map((toast, index) => (
                    <div 
                        key={toast.id} 
                        className="pointer-events-auto"
                        style={{
                            transitionDelay: `${index * 50}ms`
                        }}
                    >
                        <Toast
                            {...toast}
                            onDismiss={() => dismissToast(toast.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ToastContainer;