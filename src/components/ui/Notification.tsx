'use client';

import React from 'react';

interface NotificationProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onClose?: () => void;
    className?: string;
}

export const Notification: React.FC<NotificationProps> = ({
    message,
    type = 'info',
    onClose,
    className = '',
}) => {
    const getNotificationStyles = () => {
        const baseStyles = 'fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-lg shadow-lg border';
        
        switch (type) {
            case 'success':
                return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
            case 'error':
                return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
            case 'warning':
                return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
            default:
                return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            default:
                return 'ℹ️';
        }
    };

    return (
        <div className={`${getNotificationStyles()} ${className}`}>
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <span className="text-lg">{getIcon()}</span>
                </div>
                <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-medium">{message}</p>
                </div>
                {onClose && (
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={onClose}
                            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <span className="sr-only">Close</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notification;