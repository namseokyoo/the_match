'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TournamentList } from '@/components/tournament';
import { Button } from '@/components/ui';
import { Tournament } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function TournamentsPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // 토너먼트 목록 조회
    const fetchTournaments = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/tournaments');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '토너먼트 목록을 불러오는데 실패했습니다.');
            }

            setTournaments(data.data || []);
            setError(null);
        } catch (err) {
            console.error('토너먼트 목록 조회 오류:', err);
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchTournaments();
    }, []);

    // 토너먼트 보기
    const handleView = (id: string) => {
        router.push(`/tournaments/${id}`);
    };

    // 토너먼트 수정
    const handleEdit = (id: string) => {
        router.push(`/tournaments/${id}/edit`);
    };

    // 토너먼트 삭제
    const handleDelete = async (id: string) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        const confirmDelete = window.confirm('정말로 이 토너먼트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
        if (!confirmDelete) return;

        try {
            const response = await fetch(`/api/tournaments/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.access_token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '토너먼트 삭제에 실패했습니다.');
            }

            // 성공 시 목록 새로고침
            await fetchTournaments();
            alert('토너먼트가 성공적으로 삭제되었습니다.');
        } catch (err) {
            console.error('토너먼트 삭제 오류:', err);
            alert(err instanceof Error ? err.message : '토너먼트 삭제 중 오류가 발생했습니다.');
        }
    };

    // 토너먼트 생성 페이지로 이동
    const handleCreateTournament = () => {
        if (!user) {
            alert('토너먼트를 생성하려면 로그인이 필요합니다.');
            router.push('/login');
            return;
        }
        router.push('/tournaments/create');
    };

    // 로딩 중일 때
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-match-blue"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 페이지 헤더 */}
                <div className="mb-8">
                    <div className="sm:flex sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">토너먼트</h1>
                            <p className="mt-2 text-sm text-gray-700">
                                다양한 토너먼트를 찾아보고 참가해보세요.
                            </p>
                        </div>
                        <div className="mt-4 sm:mt-0">
                            <Button
                                onClick={handleCreateTournament}
                                variant="primary"
                                size="md"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                토너먼트 생성
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 토너먼트 목록 */}
                <TournamentList
                    tournaments={tournaments}
                    loading={loading}
                    error={error}
                    currentUserId={user?.id}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRefresh={fetchTournaments}
                />

                {/* 빈 상태 (토너먼트가 없을 때) */}
                {!loading && !error && tournaments.length === 0 && (
                    <div className="text-center py-12">
                        <div className="mx-auto max-w-md">
                            <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                아직 토너먼트가 없습니다
                            </h3>
                            <p className="text-gray-600 mb-6">
                                첫 번째 토너먼트를 생성하여 경쟁을 시작해보세요!
                            </p>
                            <Button
                                onClick={handleCreateTournament}
                                variant="primary"
                                size="md"
                            >
                                첫 토너먼트 만들기
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 