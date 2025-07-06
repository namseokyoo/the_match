'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MatchForm } from '@/components/match';
import { CreateMatchForm } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function CreateMatchPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // 경기 생성 핸들러
    const handleSubmit = async (formData: CreateMatchForm) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            router.push('/login');
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch('/api/matches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.access_token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '경기 생성에 실패했습니다.');
            }

            alert('경기가 성공적으로 생성되었습니다!');
            router.push(`/matches/${data.data.id}`);
        } catch (error) {
            console.error('경기 생성 오류:', error);
            alert(error instanceof Error ? error.message : '경기 생성 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 취소 핸들러
    const handleCancel = () => {
        router.push('/matches');
    };

    // 인증 로딩 중
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-match-blue"></div>
            </div>
        );
    }

    // 로그인되지 않은 경우
    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 브레드크럼 */}
                <nav className="flex mb-8" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                        <li className="inline-flex items-center">
                            <button
                                onClick={() => router.push('/matches')}
                                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-match-blue"
                            >
                                경기
                            </button>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                </svg>
                                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">생성</span>
                            </div>
                        </li>
                    </ol>
                </nav>

                {/* 페이지 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">새 경기 만들기</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        새로운 경기를 생성하여 팀들의 경쟁을 시작하세요.
                    </p>
                </div>

                {/* 경기 생성 폼 */}
                <MatchForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isLoading={isLoading}
                    mode="create"
                />

                {/* 도움말 */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                경기 생성 안내
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>경기를 생성한 후 팀들이 참가 신청을 할 수 있습니다.</li>
                                    <li>등록 마감일 이후에는 새로운 팀이 참가할 수 없습니다.</li>
                                    <li>경기 생성자는 언제든 경기 정보를 수정하거나 삭제할 수 있습니다.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 