'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import InstallPWAButton from '@/components/pwa/InstallPWAButton';
import { Menu, X } from 'lucide-react';

const SimpleNavbar = () => {
    const { user, signOut, loading, isAuthenticated } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const router = useRouter();

    const handleSignOut = async () => {
        // 이미 로그아웃 중이면 중복 실행 방지
        if (isLoggingOut) {
            return;
        }

        try {
            setIsLoggingOut(true);
            await signOut();
            
            // 로그아웃 성공 시 홈으로 이동
            router.push('/');
            setIsMobileMenuOpen(false);
        } finally {
            setIsLoggingOut(false);
        }
    };

    // 초기 로딩 상태 - 스켈레톤 UI를 보여주되 전체 네비바 구조는 유지
    const showSkeleton = loading;

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* 로고 */}
                    <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">T</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900 hidden xs:block">The Match</span>
                    </Link>

                    {/* 데스크톱 메뉴 */}
                    <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
                        <Link
                            href="/matches"
                            className="text-gray-600 hover:text-gray-900 px-2 xl:px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                        >
                            경기
                        </Link>
                        <Link
                            href="/matches/templates"
                            className="text-gray-600 hover:text-gray-900 px-2 xl:px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                        >
                            템플릿
                        </Link>
                        <Link
                            href="/teams"
                            className="text-gray-600 hover:text-gray-900 px-2 xl:px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                            data-tour="teams"
                        >
                            팀
                        </Link>
                        <Link
                            href="/players"
                            className="text-gray-600 hover:text-gray-900 px-2 xl:px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                        >
                            선수
                        </Link>

                        {showSkeleton ? (
                            // 초기 로딩 중 - 부드러운 스켈레톤 UI
                            <div className="flex items-center space-x-2">
                                <div className="animate-pulse h-9 w-16 bg-gray-200 rounded-md"></div>
                                <div className="animate-pulse h-9 w-20 bg-gray-200 rounded-md"></div>
                            </div>
                        ) : isAuthenticated ? (
                            // 로그인된 상태
                            <div className="flex items-center space-x-2 xl:space-x-4">
                                <InstallPWAButton />
                                <Link
                                    href="/dashboard"
                                    className="text-gray-600 hover:text-gray-900 px-2 xl:px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                                    data-tour="dashboard"
                                >
                                    대시보드
                                </Link>
                                <Link
                                    href="/profile"
                                    className="text-sm text-gray-700 hover:text-gray-900 whitespace-nowrap"
                                >
                                    {user?.email?.split('@')[0] || '사용자'}님
                                </Link>
                                <Link
                                    href="/teams/create"
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-3 xl:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                                >
                                    팀 생성
                                </Link>
                                <Link
                                    href="/matches/create"
                                    className="bg-success-600 hover:bg-success-700 text-white px-3 xl:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                                    data-tour="create-match"
                                >
                                    경기 생성
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    disabled={isLoggingOut}
                                    className={`px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                                        isLoggingOut
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    {isLoggingOut ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            로그아웃 중...
                                        </span>
                                    ) : (
                                        '로그아웃'
                                    )}
                                </button>
                            </div>
                        ) : (
                            // 로그인되지 않은 상태
                            <div className="flex items-center space-x-2 xl:space-x-4">
                                <Link
                                    href="/login"
                                    className="text-gray-600 hover:text-gray-900 px-2 xl:px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                                >
                                    로그인
                                </Link>
                                <Link
                                    href="/signup"
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-3 xl:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                                >
                                    회원가입
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* 태블릿/모바일 간소화 메뉴 */}
                    <div className="flex lg:hidden items-center space-x-2">
                        {showSkeleton ? (
                            <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
                        ) : isAuthenticated ? (
                            <>
                                <Link
                                    href="/teams/create"
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors"
                                >
                                    팀 생성
                                </Link>
                                <Link
                                    href="/matches/create"
                                    className="bg-success-600 hover:bg-success-700 text-white px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors"
                                >
                                    경기 생성
                                </Link>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors"
                            >
                                로그인
                            </Link>
                        )}
                        
                        {/* 모바일 메뉴 토글 */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* 모바일 메뉴 드롭다운 */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden border-t border-gray-200">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <Link
                                href="/matches"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                            >
                                경기
                            </Link>
                            <Link
                                href="/matches/templates"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                            >
                                템플릿
                            </Link>
                            <Link
                                href="/teams"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                            >
                                팀
                            </Link>
                            <Link
                                href="/players"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                            >
                                선수
                            </Link>
                            
                            {isAuthenticated && (
                                <>
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                    >
                                        대시보드
                                    </Link>
                                    <Link
                                        href="/profile"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                    >
                                        프로필 ({user?.email?.split('@')[0] || '사용자'}님)
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        disabled={isLoggingOut}
                                        className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                                            isLoggingOut
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                    >
                                        {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                                    </button>
                                </>
                            )}
                            
                            {!isAuthenticated && !showSkeleton && (
                                <Link
                                    href="/signup"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                >
                                    회원가입
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default SimpleNavbar;