'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trophy, Users, AlertCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useRealtimeUpdates';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { EmptyState } from '@/components/ui';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'match' | 'team' | 'system' | 'alert';
    read: boolean;
    created_at: string;
    link?: string;
    icon?: string;
}

export const NotificationCenter: React.FC = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        isConnected,
    } = useNotifications(user?.id || '');

    // 아이콘 매핑
    const getIcon = (type: string) => {
        switch (type) {
            case 'match':
                return <Trophy className="w-5 h-5" />;
            case 'team':
                return <Users className="w-5 h-5" />;
            case 'system':
                return <AlertCircle className="w-5 h-5" />;
            default:
                return <Bell className="w-5 h-5" />;
        }
    };

    // 알림 클릭 처리
    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        
        if (notification.link) {
            window.location.href = notification.link;
        }
        
        setIsOpen(false);
    };

    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.notification-center')) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (!user) return null;

    return (
        <div className="notification-center relative">
            {/* 알림 버튼 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="알림"
            >
                <Bell className="w-6 h-6 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                {!isConnected && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-400 rounded-full" />
                )}
            </button>

            {/* 알림 드롭다운 */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    {/* 헤더 */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold">알림</h3>
                            {!isConnected && (
                                <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">
                                    오프라인
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    모두 읽음
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* 알림 목록 */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => {
                                const notificationUI = notification as any;
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notificationUI)}
                                        className={`
                                            p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors
                                            ${!notification.read ? 'bg-blue-50' : ''}
                                        `}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className={`
                                                flex-shrink-0 p-2 rounded-full
                                                ${!notification.read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                                            `}>
                                                {getIcon(notificationUI.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`
                                                    text-sm font-medium text-gray-900
                                                    ${!notification.read ? 'font-semibold' : ''}
                                                `}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {formatDistanceToNow(new Date(notification.created_at), {
                                                        addSuffix: true,
                                                        locale: ko,
                                                    })}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="flex-shrink-0">
                                                    <span className="w-2 h-2 bg-blue-600 rounded-full inline-block" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-4">
                                <EmptyState
                                    icon={Bell}
                                    title="알림이 없습니다"
                                    description="새로운 알림이 오면 여기에 표시됩니다"
                                />
                            </div>
                        )}
                    </div>

                    {/* 푸터 */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200">
                            <a
                                href="/notifications"
                                className="block text-center text-sm text-blue-600 hover:text-blue-700"
                            >
                                모든 알림 보기
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// 알림 페이지 컴포넌트
export const NotificationPage: React.FC = () => {
    const { user } = useAuth();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        isConnected,
    } = useNotifications(user?.id || '');

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const getIcon = (type: string) => {
        switch (type) {
            case 'match':
                return <Trophy className="w-6 h-6" />;
            case 'team':
                return <Users className="w-6 h-6" />;
            case 'system':
                return <AlertCircle className="w-6 h-6" />;
            default:
                return <Bell className="w-6 h-6" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'match':
                return 'bg-green-100 text-green-600';
            case 'team':
                return 'bg-blue-100 text-blue-600';
            case 'system':
                return 'bg-yellow-100 text-yellow-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* 헤더 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">알림</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '모든 알림을 확인했습니다'}
                        </p>
                    </div>
                    {!isConnected && (
                        <span className="text-sm text-yellow-600 bg-yellow-100 px-3 py-1 rounded">
                            오프라인 모드
                        </span>
                    )}
                </div>

                {/* 필터 및 액션 */}
                <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === 'all'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            전체
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === 'unread'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            읽지 않음
                        </button>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">모두 읽음 표시</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 알림 목록 */}
            <div className="space-y-4">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => {
                        const notificationUI = notification as any;
                        return (
                            <div
                                key={notification.id}
                                className={`
                                    bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer
                                    hover:shadow-md transition-shadow
                                    ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}
                                `}
                                onClick={() => {
                                    if (!notification.read) {
                                        markAsRead(notification.id);
                                    }
                                    if (notificationUI.link) {
                                        window.location.href = notificationUI.link;
                                    }
                                }}
                            >
                                <div className="flex items-start space-x-4">
                                    <div className={`flex-shrink-0 p-3 rounded-full ${getTypeColor(notificationUI.type)}`}>
                                        {getIcon(notificationUI.type)}
                                    </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className={`text-lg font-medium text-gray-900 ${
                                                !notification.read ? 'font-semibold' : ''
                                            }`}>
                                                {notification.title}
                                            </h3>
                                            <p className="text-gray-600 mt-1">
                                                {notification.message}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-4 mt-3">
                                        <span className="text-sm text-gray-400">
                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                                locale: ko,
                                            })}
                                        </span>
                                        {notificationUI.link && (
                                            <span className="text-sm text-blue-600 hover:text-blue-700">
                                                자세히 보기 →
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        );
                    })
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <EmptyState
                            icon={Bell}
                            title={filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
                            description="새로운 알림이 오면 여기에 표시됩니다"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;