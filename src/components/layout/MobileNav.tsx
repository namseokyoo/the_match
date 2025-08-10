'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Trophy, Users, User, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const MobileNav: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();

    const isActive = (path: string) => {
        if (path === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(path);
    };

    const navItems = [
        {
            path: '/',
            icon: Home,
            label: '홈',
            requireAuth: false,
        },
        {
            path: '/matches',
            icon: Trophy,
            label: '경기',
            requireAuth: false,
        },
        {
            path: '/teams',
            icon: Users,
            label: '팀',
            requireAuth: false,
        },
        {
            path: user ? '/profile' : '/login',
            icon: User,
            label: user ? '프로필' : '로그인',
            requireAuth: false,
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
            <nav className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    if (item.requireAuth && !user) {
                        return null;
                    }

                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                                active 
                                    ? 'text-blue-600' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${active ? 'stroke-2' : ''}`} />
                            <span className="text-xs mt-1">{item.label}</span>
                        </button>
                    );
                })}
                
                {/* 플로팅 액션 버튼 */}
                {user && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <button
                            onClick={() => router.push('/matches/create')}
                            className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
                            aria-label="경기 생성"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </nav>
        </div>
    );
};

export default MobileNav;