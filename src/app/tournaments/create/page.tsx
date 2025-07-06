'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TournamentForm } from '@/components/tournament';
import { CreateTournamentForm } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function CreateTournamentPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // 인증되지 않은 사용자 리다이렉트
    React.useEffect(() => {
        if (!authLoading && !user) {
            alert('토너먼트를 생성하려면 로그인이 필요합니다.');
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // 토너먼트 생성 처리
    const handleSubmit = async (data: CreateTournamentForm) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            router.push('/login');
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch('/api/tournaments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.access_token}`,
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '토너먼트 생성에 실패했습니다.');
            }

            // 성공 시 생성된 토너먼트 페이지로 이동
            alert('토너먼트가 성공적으로 생성되었습니다!');
            router.push(`/tournaments/${result.data.id}`);

        } catch (error) {
            console.error('토너먼트 생성 오류:', error);
            alert(error instanceof Error ? error.message : '토너먼트 생성 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 취소 처리
    const handleCancel = () => {
        const hasUnsavedChanges = window.confirm('작성 중인 내용이 삭제됩니다. 정말로 취소하시겠습니까?');
        if (hasUnsavedChanges) {
            router.push('/tournaments');
        }
    };

    // 로딩 중일 때
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-match-blue"></div>
            </div>
        );
    }

    // 인증되지 않은 사용자
    if (!user) {
        return null; // useEffect에서 리다이렉트 처리됨
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 페이지 헤더 */}
                <div className="mb-8">
                    <div className="sm:flex sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">토너먼트 생성</h1>
                            <p className="mt-2 text-sm text-gray-700">
                                새로운 토너먼트를 생성하여 경쟁을 시작해보세요.
                            </p>
                        </div>
                        <div className="mt-4 sm:mt-0">
                            <nav className="flex" aria-label="Breadcrumb">
                                <ol role="list" className="flex items-center space-x-4">
                                    <li>
                                        <div>
                                            <button
                                                onClick={() => router.push('/tournaments')}
                                                className="text-gray-400 hover:text-gray-500"
                                            >
                                                <span className="sr-only">토너먼트</span>
                                                토너먼트
                                            </button>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="flex items-center">
                                            <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className="ml-4 text-sm font-medium text-gray-500">생성</span>
                                        </div>
                                    </li>
                                </ol>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* 토너먼트 생성 폼 */}
                <div className="bg-white shadow-sm rounded-lg">
                    <div className="px-6 py-6">
                        <TournamentForm
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isLoading={isLoading}
                            mode="create"
                        />
                    </div>
                </div>

                {/* 안내 정보 */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                토너먼트 생성 안내
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>토너먼트는 생성 후 '준비중' 상태로 시작됩니다.</li>
                                    <li>참가팀 모집을 시작하려면 상태를 '등록중'으로 변경해주세요.</li>
                                    <li>등록 마감일과 시작일은 언제든지 수정 가능합니다.</li>
                                    <li>토너먼트가 시작되면 기본 정보 수정이 제한됩니다.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 