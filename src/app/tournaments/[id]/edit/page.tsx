'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TournamentForm } from '@/components/tournament';
import { Button } from '@/components/ui';
import { Tournament, UpdateTournamentForm } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function EditTournamentPage() {
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const tournamentId = params.id as string;

    // 토너먼트 데이터 조회
    const fetchTournament = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/tournaments/${tournamentId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '토너먼트 정보를 불러오는데 실패했습니다.');
            }

            setTournament(data.data);
            setError(null);
        } catch (err) {
            console.error('토너먼트 조회 오류:', err);
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        if (tournamentId) {
            fetchTournament();
        }
    }, [tournamentId]);

    // 권한 확인
    useEffect(() => {
        if (!authLoading && !user) {
            alert('토너먼트를 수정하려면 로그인이 필요합니다.');
            router.push('/login');
        } else if (tournament && user && tournament.created_by !== user.id) {
            alert('토너먼트 수정 권한이 없습니다.');
            router.push(`/tournaments/${tournamentId}`);
        }
    }, [user, authLoading, tournament, router, tournamentId]);

    // 토너먼트 수정 처리
    const handleSubmit = async (data: UpdateTournamentForm) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            router.push('/login');
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch(`/api/tournaments/${tournamentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.access_token}`,
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '토너먼트 수정에 실패했습니다.');
            }

            // 성공 시 토너먼트 상세 페이지로 이동
            alert('토너먼트가 성공적으로 수정되었습니다!');
            router.push(`/tournaments/${tournamentId}`);

        } catch (error) {
            console.error('토너먼트 수정 오류:', error);
            alert(error instanceof Error ? error.message : '토너먼트 수정 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 취소 처리
    const handleCancel = () => {
        const hasUnsavedChanges = window.confirm('작성 중인 내용이 삭제됩니다. 정말로 취소하시겠습니까?');
        if (hasUnsavedChanges) {
            router.push(`/tournaments/${tournamentId}`);
        }
    };

    // 로딩 중일 때
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-match-blue"></div>
            </div>
        );
    }

    // 오류 발생 시
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto max-w-md">
                        <svg className="w-20 h-20 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            오류가 발생했습니다
                        </h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="space-x-4">
                            <Button
                                onClick={fetchTournament}
                                variant="primary"
                                size="md"
                            >
                                다시 시도
                            </Button>
                            <Button
                                onClick={() => router.push('/tournaments')}
                                variant="secondary"
                                size="md"
                            >
                                목록으로 돌아가기
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 토너먼트를 찾을 수 없는 경우
    if (!tournament) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto max-w-md">
                        <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            토너먼트를 찾을 수 없습니다
                        </h3>
                        <p className="text-gray-600 mb-6">
                            요청하신 토너먼트가 존재하지 않거나 삭제되었습니다.
                        </p>
                        <Button
                            onClick={() => router.push('/tournaments')}
                            variant="primary"
                            size="md"
                        >
                            토너먼트 목록으로 이동
                        </Button>
                    </div>
                </div>
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
                            <h1 className="text-3xl font-bold text-gray-900">토너먼트 수정</h1>
                            <p className="mt-2 text-sm text-gray-700">
                                토너먼트 정보를 수정하세요.
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
                                                토너먼트
                                            </button>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="flex items-center">
                                            <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <button
                                                onClick={() => router.push(`/tournaments/${tournamentId}`)}
                                                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                                            >
                                                {tournament.name}
                                            </button>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="flex items-center">
                                            <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className="ml-4 text-sm font-medium text-gray-500">수정</span>
                                        </div>
                                    </li>
                                </ol>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* 토너먼트 수정 폼 */}
                <div className="bg-white shadow-sm rounded-lg">
                    <div className="px-6 py-6">
                        <TournamentForm
                            tournament={tournament}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isLoading={isLoading}
                            mode="edit"
                        />
                    </div>
                </div>

                {/* 수정 제한 안내 */}
                {['active', 'completed'].includes(tournament.status) && (
                    <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    수정 제한 안내
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    {tournament.status === 'active' && (
                                        <p>진행 중인 토너먼트는 일부 정보만 수정 가능합니다. 토너먼트 형식, 최대 참가 팀 수 등은 변경할 수 없습니다.</p>
                                    )}
                                    {tournament.status === 'completed' && (
                                        <p>완료된 토너먼트는 제목과 설명만 수정 가능합니다.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 