'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification } from '@/components/ui/Notification';

interface NotificationData {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

interface NotificationContextType {
    showNotification: (message: string, type: NotificationData['type'], duration?: number) => void;
    hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);

    const hideNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const showNotification = useCallback((message: string, type: NotificationData['type'], duration = 5000) => {
        const id = Date.now().toString();
        const newNotification: NotificationData = {
            id,
            message,
            type,
            duration,
        };

        setNotifications(prev => [...prev, newNotification]);

        // Auto-hide notification after duration
        if (duration > 0) {
            setTimeout(() => {
                hideNotification(id);
            }, duration);
        }
    }, [hideNotification]);

    return (
        <NotificationContext.Provider value={{ showNotification, hideNotification }}>
            {children}
            {/* Render notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {notifications.map((notification) => (
                    <Notification
                        key={notification.id}
                        message={notification.message}
                        type={notification.type}
                        onClose={() => hideNotification(notification.id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;