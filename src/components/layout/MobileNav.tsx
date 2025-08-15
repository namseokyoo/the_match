'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Trophy, Users, User, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const MobileNav: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const [showSubMenu, setShowSubMenu] = useState(false);
    const subMenuRef = useRef<HTMLDivElement>(null);

    const isActive = (path: string) => {
        if (path === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(path);
    };

    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (subMenuRef.current && !subMenuRef.current.contains(event.target as Node)) {
                setShowSubMenu(false);
            }
        };

        if (showSubMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSubMenu]);

    const handleCreateMatch = () => {
        setShowSubMenu(false);
        router.push('/matches/create');
    };

    const handleCreateTeam = () => {
        setShowSubMenu(false);
        router.push('/teams/create');
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
        <div className="fixed bottom-0 bg-white border-t border-gray-200 z-40" style={{ width: '430px', left: '50%', transform: 'translateX(-50%)' }}>
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
                    <div className="absolute -top-6" style={{ left: '50%', transform: 'translateX(-50%)' }} ref={subMenuRef}>
                        {/* 서브메뉴 */}
                        {showSubMenu && (
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-fade-in-up">
                                <button
                                    onClick={handleCreateMatch}
                                    className="flex items-center whitespace-nowrap px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                >
                                    <Trophy className="w-5 h-5 mr-3 text-blue-600" />
                                    <span className="text-gray-900 font-medium">새 경기 만들기</span>
                                </button>
                                <button
                                    onClick={handleCreateTeam}
                                    className="flex items-center whitespace-nowrap px-4 py-3 hover:bg-gray-50 transition-colors"
                                >
                                    <Users className="w-5 h-5 mr-3 text-green-600" />
                                    <span className="text-gray-900 font-medium">새 팀 만들기</span>
                                </button>
                            </div>
                        )}
                        
                        {/* 메인 플로팅 버튼 */}
                        <button
                            onClick={() => setShowSubMenu(!showSubMenu)}
                            className={`${
                                showSubMenu ? 'bg-gray-600 rotate-45' : 'bg-blue-600'
                            } text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200`}
                            aria-label={showSubMenu ? '메뉴 닫기' : '만들기 메뉴'}
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