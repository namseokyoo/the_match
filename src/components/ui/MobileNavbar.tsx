'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import InstallPWAButton from '@/components/pwa/InstallPWAButton';
import { 
    Menu, 
    X, 
    Home, 
    Trophy, 
    Users, 
    UserCheck,
    PlusCircle,
    LogOut,
    LogIn,
    UserPlus,
    LayoutDashboard,
    User,
    BarChart3,
    MessageSquare
} from 'lucide-react';

const MobileNavbar = () => {
    const { user, signOut, loading, isAuthenticated } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // 경로 변경 시 메뉴 닫기
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    // 스크롤 시 메뉴 닫기
    useEffect(() => {
        const handleScroll = () => {
            if (isMenuOpen) {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isMenuOpen]);

    // 메뉴 열림 시 body 스크롤 방지
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    const handleSignOut = async () => {
        if (isLoggingOut) {
            return;
        }

        try {
            setIsLoggingOut(true);
            await signOut();
            router.push('/');
            setIsMenuOpen(false);
        } catch (error) {
            console.error('Logout error:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    const showSkeleton = loading;

    // 메뉴 아이템 스타일
    const menuItemClass = "flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors";
    const activeMenuItemClass = "flex items-center gap-3 px-4 py-3 text-blue-600 bg-blue-50 font-medium";

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <>
            {/* 모바일 네비게이션 바 */}
            <nav className="relative bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="px-4">
                    <div className="flex justify-between items-center h-14">
                        {/* 로고 */}
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">T</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">The Match</span>
                        </Link>

                        {/* 햄버거 메뉴 버튼 */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="메뉴"
                        >
                            {isMenuOpen ? (
                                <X className="w-6 h-6 text-gray-700" />
                            ) : (
                                <Menu className="w-6 h-6 text-gray-700" />
                            )}
                        </button>
                    </div>
                </div>

                {/* 모바일 메뉴 - 사용자 상태 중심 */}
                <div className={`absolute top-full right-0 bottom-0 w-80 bg-white transform transition-transform duration-300 z-50 shadow-xl ${
                    isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`} style={{ height: 'calc(100vh - 56px)' }}>
                    <div className="h-full overflow-y-auto">

                        {showSkeleton ? (
                            // 로딩 중
                            <div className="p-6 space-y-4">
                                <div className="animate-pulse h-20 bg-gray-200 rounded-lg"></div>
                                <div className="animate-pulse h-12 bg-gray-200 rounded-lg"></div>
                                <div className="animate-pulse h-12 bg-gray-200 rounded-lg"></div>
                            </div>
                        ) : isAuthenticated ? (
                            // 로그인된 상태
                            <>
                                {/* 사용자 프로필 카드 */}
                                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-b border-gray-200">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                                            <User className="w-9 h-9 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-lg font-semibold text-gray-900">
                                                {user?.email?.split('@')[0] || '사용자'}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {user?.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <Link 
                                            href="/dashboard"
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <LayoutDashboard className="w-5 h-5" />
                                            <span className="text-sm font-medium">대시보드</span>
                                        </Link>
                                        <Link 
                                            href="/profile"
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <User className="w-5 h-5" />
                                            <span className="text-sm font-medium">프로필</span>
                                        </Link>
                                    </div>
                                </div>

                                {/* 빠른 액션 */}
                                <div className="p-6">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">빠른 액션</h3>
                                    <div className="space-y-3">
                                        <Link 
                                            href="/matches/create"
                                            className="flex items-center gap-3 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:shadow-lg"
                                        >
                                            <PlusCircle className="w-6 h-6" />
                                            <span className="font-medium">새 경기 만들기</span>
                                        </Link>
                                        <Link 
                                            href="/teams/create"
                                            className="flex items-center gap-3 w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
                                        >
                                            <Users className="w-6 h-6" />
                                            <span className="font-medium">팀 생성하기</span>
                                        </Link>
                                    </div>
                                </div>

                                {/* 로그아웃 */}
                                <div className="p-4 border-t border-gray-200">
                                    <button
                                        onClick={handleSignOut}
                                        disabled={isLoggingOut}
                                        className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg transition-colors ${
                                            isLoggingOut
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <LogOut className="w-6 h-6" />
                                        <span className="font-medium">
                                            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                                        </span>
                                    </button>
                                </div>

                                {/* PWA 설치 버튼 */}
                                <div className="px-4 pb-4">
                                    <InstallPWAButton />
                                </div>
                            </>
                        ) : (
                            // 로그인되지 않은 상태
                            <div className="p-4 space-y-3">
                                <Link 
                                    href="/login"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <LogIn className="w-6 h-6" />
                                    <span className="font-medium">로그인</span>
                                </Link>
                                <Link 
                                    href="/signup"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <UserPlus className="w-6 h-6" />
                                    <span className="font-medium">회원가입</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>


            {/* 데스크톱 네비게이션 바 - 모바일 크기에서는 숨김 */}
            <nav className="hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* 로고 */}
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">T</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">The Match</span>
                        </Link>

                        {/* 메뉴 */}
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/matches"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                경기
                            </Link>
                            {/* 템플릿 메뉴 - 임시 숨김
                            <Link
                                href="/matches/templates"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                템플릿
                            </Link>
                            */}
                            <Link
                                href="/teams"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                팀
                            </Link>
                            <Link
                                href="/community"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                커뮤니티
                            </Link>

                            {showSkeleton ? (
                                // 초기 로딩 중
                                <div className="flex items-center space-x-2">
                                    <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
                                    <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
                                </div>
                            ) : isAuthenticated ? (
                                // 로그인된 상태
                                <div className="flex items-center space-x-4">
                                    <InstallPWAButton />
                                    <Link
                                        href="/dashboard"
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        대시보드
                                    </Link>
                                    <Link
                                        href="/profile"
                                        className="text-sm text-gray-700 hover:text-gray-900"
                                    >
                                        {user?.email?.split('@')[0] || '사용자'}님
                                    </Link>
                                    <Link
                                        href="/teams/create"
                                        className="bg-match-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        팀 생성
                                    </Link>
                                    <Link
                                        href="/matches/create"
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        경기 생성
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        disabled={isLoggingOut}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                            isLoggingOut
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                    >
                                        {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                                    </button>
                                </div>
                            ) : (
                                // 로그인되지 않은 상태
                                <div className="flex items-center space-x-4">
                                    <Link
                                        href="/login"
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        로그인
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        회원가입
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default MobileNavbar;