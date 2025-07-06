'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TournamentDetail } from '@/components/tournament';
import { Button } from '@/components/ui/Button';
import { Tournament } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function TournamentDetailPage() {
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const tournamentId = params.id as string;

    // 토너먼트 상세 정보 조회
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

    // 토너먼트 수정 페이지로 이동
    const handleEdit = () => {
        router.push(`/tournaments/${tournamentId}/edit`);
    };

    // 토너먼트 삭제
    const handleDelete = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        const confirmDelete = window.confirm('정말로 이 토너먼트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
        if (!confirmDelete) return;

        try {
            const response = await fetch(`/api/tournaments/${tournamentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.access_token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '토너먼트 삭제에 실패했습니다.');
            }

            // 성공 시 토너먼트 목록으로 이동
            alert('토너먼트가 성공적으로 삭제되었습니다.');
            router.push('/tournaments');
        } catch (err) {
            console.error('토너먼트 삭제 오류:', err);
            alert(err instanceof Error ? err.message : '토너먼트 삭제 중 오류가 발생했습니다.');
        }
    };

    // 토너먼트 참가
    const handleJoin = async () => {
        if (!user) {
            alert('토너먼트에 참가하려면 로그인이 필요합니다.');
            router.push('/login');
            return;
        }

        try {
            const response = await fetch(`/api/tournaments/${tournamentId}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.access_token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '토너먼트 참가에 실패했습니다.');
            }

            // 성공 시 토너먼트 정보 새로고침
            await fetchTournament();
            alert('토너먼트에 성공적으로 참가했습니다!');
        } catch (err) {
            console.error('토너먼트 참가 오류:', err);
            alert(err instanceof Error ? err.message : '토너먼트 참가 중 오류가 발생했습니다.');
        }
    };

    // 토너먼트 참가 취소
    const handleLeave = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        const confirmLeave = window.confirm('정말로 토너먼트 참가를 취소하시겠습니까?');
        if (!confirmLeave) return;

        try {
            const response = await fetch(`/api/tournaments/${tournamentId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.access_token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '토너먼트 참가 취소에 실패했습니다.');
            }

            // 성공 시 토너먼트 정보 새로고침
            await fetchTournament();
            alert('토너먼트 참가가 취소되었습니다.');
        } catch (err) {
            console.error('토너먼트 참가 취소 오류:', err);
            alert(err instanceof Error ? err.message : '토너먼트 참가 취소 중 오류가 발생했습니다.');
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

    // 사용자 권한 확인
    const isOwner = user?.id === tournament.created_by;
    const canEdit = isOwner;
    const canDelete = isOwner && ['draft', 'registration'].includes(tournament.status);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 페이지 헤더 */}
                <div className="mb-8">
                    <div className="sm:flex sm:items-center sm:justify-between">
                        <div>
                            <nav className="flex mb-4" aria-label="Breadcrumb">
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
                                            <span className="ml-4 text-sm font-medium text-gray-500">{tournament.name}</span>
                                        </div>
                                    </li>
                                </ol>
                            </nav>
                            <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
                            <p className="mt-2 text-sm text-gray-700">
                                {tournament.description}
                            </p>
                        </div>
                        <div className="mt-4 sm:mt-0 flex space-x-3">
                            {canEdit && (
                                <Button
                                    onClick={handleEdit}
                                    variant="secondary"
                                    size="md"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    수정
                                </Button>
                            )}
                            {canDelete && (
                                <Button
                                    onClick={handleDelete}
                                    variant="danger"
                                    size="md"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    삭제
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 토너먼트 상세 정보 */}
                <TournamentDetail
                    tournament={tournament}
                    currentUserId={user?.id}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    onRefresh={fetchTournament}
                />
            </div>
        </div>
    );
} 