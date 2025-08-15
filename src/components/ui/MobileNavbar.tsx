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

                {/* 모바일 메뉴 */}
                <div className={`absolute top-full right-0 bottom-0 w-full bg-white transform transition-transform duration-300 z-50 ${
                    isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`} style={{ height: 'calc(100vh - 56px)' }}>
                    <div className="h-full overflow-y-auto">
                        {/* 메인 네비게이션 */}
                        <div className="border-b border-gray-200 pb-4 pt-2">
                            <Link 
                                href="/"
                                className={isActive('/') && pathname === '/' ? activeMenuItemClass : menuItemClass}
                            >
                                <Home className="w-5 h-5" />
                                <span>홈</span>
                            </Link>
                            <Link 
                                href="/matches"
                                className={isActive('/matches') ? activeMenuItemClass : menuItemClass}
                            >
                                <Trophy className="w-5 h-5" />
                                <span>경기</span>
                            </Link>
                            <Link 
                                href="/teams"
                                className={isActive('/teams') ? activeMenuItemClass : menuItemClass}
                            >
                                <Users className="w-5 h-5" />
                                <span>팀</span>
                            </Link>
                            <Link 
                                href="/players"
                                className={isActive('/players') ? activeMenuItemClass : menuItemClass}
                            >
                                <UserCheck className="w-5 h-5" />
                                <span>선수</span>
                            </Link>
                            {/* 템플릿 메뉴 - 임시 숨김
                            <Link 
                                href="/matches/templates"
                                className={isActive('/matches/templates') ? activeMenuItemClass : menuItemClass}
                            >
                                <LayoutTemplate className="w-5 h-5" />
                                <span>템플릿</span>
                            </Link>
                            */}
                            <Link 
                                href="/stats"
                                className={isActive('/stats') ? activeMenuItemClass : menuItemClass}
                            >
                                <BarChart3 className="w-5 h-5" />
                                <span>통계</span>
                            </Link>
                            <Link 
                                href="/community"
                                className={isActive('/community') ? activeMenuItemClass : menuItemClass}
                            >
                                <MessageSquare className="w-5 h-5" />
                                <span>커뮤니티</span>
                            </Link>
                        </div>

                        {showSkeleton ? (
                            // 로딩 중
                            <div className="p-4 space-y-3">
                                <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                                <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                            </div>
                        ) : isAuthenticated ? (
                            // 로그인된 상태
                            <>
                                {/* 사용자 정보 */}
                                <div className="border-b border-gray-200 p-4">
                                    <div className="text-sm text-gray-600 mb-3">
                                        {user?.email?.split('@')[0] || '사용자'}님
                                    </div>
                                    <div className="space-y-2">
                                        <Link 
                                            href="/dashboard"
                                            className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-center hover:bg-gray-200 transition-colors"
                                        >
                                            <LayoutDashboard className="w-4 h-4 inline mr-2" />
                                            대시보드
                                        </Link>
                                        <Link 
                                            href="/profile"
                                            className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-center hover:bg-gray-200 transition-colors"
                                        >
                                            <User className="w-4 h-4 inline mr-2" />
                                            프로필
                                        </Link>
                                    </div>
                                </div>

                                {/* 생성 버튼들 */}
                                <div className="p-4 space-y-3">
                                    <Link 
                                        href="/matches/create"
                                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <PlusCircle className="w-5 h-5" />
                                        <span className="font-medium">경기 생성</span>
                                    </Link>
                                    <Link 
                                        href="/teams/create"
                                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <PlusCircle className="w-5 h-5" />
                                        <span className="font-medium">팀 생성</span>
                                    </Link>
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
                                        <LogOut className="w-5 h-5" />
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
                                    <LogIn className="w-5 h-5" />
                                    <span className="font-medium">로그인</span>
                                </Link>
                                <Link 
                                    href="/signup"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <UserPlus className="w-5 h-5" />
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
                                href="/players"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                선수
                            </Link>
                            <Link
                                href="/stats"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                통계
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