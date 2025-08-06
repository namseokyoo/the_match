'use client';

import React from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
}

export const showToast = (message: string, type: ToastProps['type'] = 'info') => {
    // 간단한 토스트 구현 (react-hot-toast 대신 사용)
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // 스타일 적용
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
    };

    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white ${colors[type]} shadow-lg transition-all transform translate-y-0 opacity-100 z-50`;
    
    toastContainer.appendChild(toast);

    // 3초 후 제거
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
};

export const ToastContainer: React.FC = () => {
    return <div id="toast-container" className="fixed bottom-0 right-0 p-4 z-50" />;
};

export default ToastContainer;