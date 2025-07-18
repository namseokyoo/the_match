'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MatchDetail, ParticipantList } from '@/components/match';
import { Match, Team } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function MatchDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, getAccessToken } = useAuth();
    const [match, setMatch] = useState<Match | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const matchId = params?.id as string;

    const fetchMatch = async () => {
        if (!matchId || matchId === 'undefined') {
            setError('경기 ID가 유효하지 않습니다.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/matches/${matchId}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '경기를 불러오는 중 오류가 발생했습니다.');
            }

            setMatch(result.data);
            setTeams(result.data.teams || []);
        } catch (error) {
            console.error('경기 조회 오류:', error);
            setError(error instanceof Error ? error.message : '경기를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatch();
    }, [matchId, refreshKey]);

    const handleJoined = () => {
        // 참가 신청 후 페이지 새로고침
        setRefreshKey(prev => prev + 1);
    };

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
            const token = await getAccessToken();
            if (!token) {
                alert('인증 토큰을 가져올 수 없습니다.');
                return;
            }

            const response = await fetch(`/api/matches/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
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

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || !match) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <div className="text-red-600 mb-4">{error || '경기를 찾을 수 없습니다.'}</div>
                    <button
                        onClick={() => router.push('/matches')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        경기 목록으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    const isOwner = user?.id === match.creator_id;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-8">
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
                    onJoined={handleJoined}
                />

                {/* 참가자 목록 */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">
                            {isOwner ? '참가 신청 관리' : '참가 신청 현황'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {isOwner
                                ? '참가 신청을 검토하고 승인/거부할 수 있습니다.'
                                : '현재 이 경기에 참가 신청한 팀들을 확인할 수 있습니다.'
                            }
                        </p>
                    </div>
                    <div className="p-6">
                        <ParticipantList
                            matchId={matchId}
                            isOwner={isOwner}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
} 