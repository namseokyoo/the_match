'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const SimpleNavbar = () => {
    const { user, signOut, loading, initialized, isAuthenticated, isSigningOut } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    const handleSignOut = async () => {
        // 이미 로그아웃 중이면 중복 실행 방지
        if (isLoggingOut || isSigningOut) {
            return;
        }

        try {
            setIsLoggingOut(true);
            const { error } = await signOut();
            
            if (!error) {
                // 로그아웃 성공 시 홈으로 이동
                router.push('/');
            } else {
                console.error('Logout error:', error);
                alert('로그아웃 중 오류가 발생했습니다.');
            }
        } finally {
            setIsLoggingOut(false);
        }
    };

    // 초기 로딩 상태 (첫 초기화 전)
    if (!initialized && loading) {
        return (
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">T</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">The Match</span>
                        </Link>
                        <div className="flex items-center space-x-2">
                            <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
                            <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
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
                        <Link
                            href="/teams"
                            className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            data-tour="teams"
                        >
                            팀
                        </Link>
                        <Link
                            href="/players"
                            className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                        >
                            선수
                        </Link>

                        {isAuthenticated ? (
                            // 로그인된 상태
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/dashboard"
                                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                    data-tour="dashboard"
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
                                    data-tour="create-match"
                                >
                                    경기 생성
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    disabled={isLoggingOut || isSigningOut}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                        isLoggingOut || isSigningOut
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    {isLoggingOut || isSigningOut ? (
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
    );
};

export default SimpleNavbar;