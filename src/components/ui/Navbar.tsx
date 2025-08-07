'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

const SimpleNavbar = () => {
    const { user, signOut, loading, isAuthenticated } = useAuth();
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    // 로딩이 3초 이상 지속되면 타임아웃 처리
    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                setLoadingTimeout(true);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setLoadingTimeout(false);
        }
    }, [loading]);

    const handleSignOut = async () => {
        await signOut();
    };

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

                        {loading && !loadingTimeout ? (
                            <span className="text-gray-500 text-sm">로딩 중...</span>
                        ) : isAuthenticated ? (
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
                                    className="bg-match-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                >
                                    팀 생성
                                </Link>
                                <Link
                                    href="/matches/create"
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                    data-tour="create-match"
                                >
                                    경기 생성
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    로그아웃
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
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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