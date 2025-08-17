'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Trophy, Users, User, Plus, MessageSquare } from 'lucide-react';
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
            path: '/community',
            icon: MessageSquare,
            label: '커뮤니티',
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
        <>
            <div className="fixed bottom-0 bg-white border-t border-gray-200 z-40" style={{ width: '430px', left: '50%', transform: 'translateX(-50%)' }}>
                <nav className="flex items-center justify-around h-20 relative">
                    {/* 활성 아이템 인디케이터 */}
                    <div 
                        className="absolute top-0 h-0.5 bg-blue-600 transition-all duration-300 ease-in-out"
                        style={{
                            width: `${100 / navItems.filter(item => !item.requireAuth || user).length}%`,
                            left: `${(navItems.filter(item => !item.requireAuth || user).findIndex(item => isActive(item.path)) * 100) / navItems.filter(item => !item.requireAuth || user).length}%`
                        }}
                    />
                    
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
                                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                                    active 
                                        ? 'text-blue-600' 
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <div className={`relative transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
                                    <Icon className={`w-6 h-6 ${active ? 'stroke-2' : ''}`} />
                                    {active && (
                                        <div className="absolute -inset-2 bg-blue-100 rounded-full opacity-30 animate-pulse" />
                                    )}
                                </div>
                                <span className={`text-xs mt-1 font-medium transition-all duration-200 ${
                                    active ? 'text-blue-600' : 'text-gray-500'
                                }`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>
            
            {/* 플로팅 액션 버튼 - 오른쪽 하단 */}
            {user && (
                <div 
                    className="fixed z-50" 
                    style={{ 
                        bottom: '80px', 
                        right: 'calc(50% - 200px)',
                        maxWidth: '430px'
                    }}
                    ref={subMenuRef}
                >
                    {/* 서브메뉴 */}
                    {showSubMenu && (
                        <div className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-fade-in-up">
                            <button
                                onClick={handleCreateMatch}
                                className="flex items-center whitespace-nowrap px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
                            >
                                <Trophy className="w-6 h-6 mr-3 text-blue-600" />
                                <span className="text-gray-900 font-medium">새 경기 만들기</span>
                            </button>
                            <button
                                onClick={handleCreateTeam}
                                className="flex items-center whitespace-nowrap px-5 py-4 hover:bg-gray-50 transition-colors"
                            >
                                <Users className="w-6 h-6 mr-3 text-green-600" />
                                <span className="text-gray-900 font-medium">새 팀 만들기</span>
                            </button>
                        </div>
                    )}
                    
                    {/* 메인 플로팅 버튼 */}
                    <button
                        onClick={() => setShowSubMenu(!showSubMenu)}
                        className={`${
                            showSubMenu ? 'bg-gray-600 rotate-45' : 'bg-blue-600 hover:bg-blue-700'
                        } text-white rounded-full p-5 shadow-lg hover:shadow-xl transition-all duration-200`}
                        aria-label={showSubMenu ? '메뉴 닫기' : '만들기 메뉴'}
                    >
                        <Plus className="w-7 h-7" />
                    </button>
                </div>
            )}
        </>
    );
};

export default MobileNav;