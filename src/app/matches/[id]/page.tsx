'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MatchDetail } from '@/components/match';
import { Match, Team } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function MatchDetailPage({ params }: { params: { id: string } }) {
    const [match, setMatch] = useState<Match | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // 경기 상세 정보 조회
    const fetchMatch = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/matches/${params.id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '경기 정보를 불러오는데 실패했습니다.');
            }

            setMatch(data.data);
            setTeams(data.data.teams || []);
            setError(null);
        } catch (err) {
            console.error('경기 조회 오류:', err);
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        if (params.id) {
            fetchMatch();
        }
    }, [params.id]);

    // 경기 수정
    const handleEdit = (id: string) => {
        router.push(`/matches/${id}/edit`);
    };

    // 경기 삭제
    const handleDelete = async (id: string) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        const confirmDelete = window.confirm('정말로 이 경기를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
        if (!confirmDelete) return;

        try {
            const response = await fetch(`/api/matches/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.access_token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '경기 삭제에 실패했습니다.');
            }

            alert('경기가 성공적으로 삭제되었습니다.');
            router.push('/matches');
        } catch (err) {
            console.error('경기 삭제 오류:', err);
            alert(err instanceof Error ? err.message : '경기 삭제 중 오류가 발생했습니다.');
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

    // 에러 상태
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/matches')}
                        className="bg-match-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                        경기 목록으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    // 경기를 찾을 수 없는 경우
    if (!match) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">경기를 찾을 수 없습니다</h1>
                    <p className="text-gray-600 mb-6">요청하신 경기가 존재하지 않거나 삭제되었습니다.</p>
                    <button
                        onClick={() => router.push('/matches')}
                        className="bg-match-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                        경기 목록으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2" title={match.title}>
                                    {match.title.length > 30 ? `${match.title.substring(0, 30)}...` : match.title}
                                </span>
                            </div>
                        </li>
                    </ol>
                </nav>

                {/* 경기 상세 정보 */}
                <MatchDetail
                    match={match}
                    teams={teams}
                    currentUserId={user?.id}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isParticipant={false} // TODO: 팀 참가 여부 확인 로직 추가
                    canJoin={false} // TODO: 참가 가능 여부 확인 로직 추가
                />
            </div>
        </div>
    );
} 