'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MatchParticipant, ParticipantStatus } from '@/types';
import ParticipantCard from './ParticipantCard';
import { useAuth } from '@/hooks/useAuth';

interface ParticipantListProps {
    matchId: string;
    isOwner?: boolean;
    className?: string;
}

interface ParticipantStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

const ParticipantList: React.FC<ParticipantListProps> = ({
    matchId,
    isOwner = false,
    className = '',
}) => {
    const { user } = useAuth();
    const [participants, setParticipants] = useState<MatchParticipant[]>([]);
    const [stats, setStats] = useState<ParticipantStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | ParticipantStatus>('all');

    // 참가자 목록 불러오기
    const fetchParticipants = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/matches/${matchId}/participants`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '참가자 목록을 불러오는 중 오류가 발생했습니다.');
            }

            setParticipants(result.data || []);
            setStats(result.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
        } catch (error) {
            console.error('참가자 목록 조회 오류:', error);
            setError(error instanceof Error ? error.message : '참가자 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }, [matchId]);

    // 참가 신청 승인
    const handleApprove = async (teamId: string) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        const reason = prompt('승인 메모를 입력하세요 (선택사항):');
        if (reason === null) return; // 취소

        try {
            // Token removed - using cookie auth
            if (!user) {
                alert('인증 토큰을 가져올 수 없습니다.');
                return;
            }

            const response = await fetch(`/api/matches/${matchId}/participants/${teamId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: ParticipantStatus.APPROVED,
                    notes: reason.trim() || undefined,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '승인 처리 중 오류가 발생했습니다.');
            }

            alert(result.message || '참가 신청을 승인했습니다.');
            await fetchParticipants(); // 목록 새로고침
        } catch (error) {
            console.error('승인 처리 오류:', error);
            alert(error instanceof Error ? error.message : '승인 처리 중 오류가 발생했습니다.');
        }
    };

    // 참가 신청 거부
    const handleReject = async (teamId: string) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        const reason = prompt('거부 사유를 입력하세요:');
        if (!reason?.trim()) {
            alert('거부 사유를 입력해주세요.');
            return;
        }

        try {
            // Token removed - using cookie auth
            if (!user) {
                alert('인증 토큰을 가져올 수 없습니다.');
                return;
            }

            const response = await fetch(`/api/matches/${matchId}/participants/${teamId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: ParticipantStatus.REJECTED,
                    notes: reason.trim(),
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '거부 처리 중 오류가 발생했습니다.');
            }

            alert(result.message || '참가 신청을 거부했습니다.');
            await fetchParticipants(); // 목록 새로고침
        } catch (error) {
            console.error('거부 처리 오류:', error);
            alert(error instanceof Error ? error.message : '거부 처리 중 오류가 발생했습니다.');
        }
    };

    // 참가 신청 취소
    const handleCancel = async (teamId: string) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (!confirm('정말로 참가 신청을 취소하시겠습니까?')) {
            return;
        }

        try {
            // Token removed - using cookie auth
            if (!user) {
                alert('인증 토큰을 가져올 수 없습니다.');
                return;
            }

            const response = await fetch(`/api/matches/${matchId}/participants/${teamId}`, {
                method: 'DELETE',
                headers: {
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '취소 처리 중 오류가 발생했습니다.');
            }

            alert(result.message || '참가 신청을 취소했습니다.');
            await fetchParticipants(); // 목록 새로고침
        } catch (error) {
            console.error('취소 처리 오류:', error);
            alert(error instanceof Error ? error.message : '취소 처리 중 오류가 발생했습니다.');
        }
    };

    // 컴포넌트 마운트 시 참가자 목록 불러오기
    useEffect(() => {
        if (matchId) {
            fetchParticipants();
        }
    }, [matchId, fetchParticipants]);

    // 필터링된 참가자 목록
    const filteredParticipants = participants.filter(participant => {
        if (filter === 'all') return true;
        return participant.status === filter;
    });

    if (loading) {
        return (
            <div className={`flex justify-center items-center py-8 ${className}`}>
                <div className="text-gray-500">참가자 목록을 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <div className="text-red-600 mb-4">{error}</div>
                <button
                    onClick={fetchParticipants}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* 통계 및 필터 */}
            <div className="mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        참가 신청 현황 ({stats.total}팀)
                    </h2>

                    {/* 상태 필터 */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1 rounded text-sm ${filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            전체 ({stats.total})
                        </button>
                        <button
                            onClick={() => setFilter(ParticipantStatus.PENDING)}
                            className={`px-3 py-1 rounded text-sm ${filter === ParticipantStatus.PENDING
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            대기중 ({stats.pending})
                        </button>
                        <button
                            onClick={() => setFilter(ParticipantStatus.APPROVED)}
                            className={`px-3 py-1 rounded text-sm ${filter === ParticipantStatus.APPROVED
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            승인됨 ({stats.approved})
                        </button>
                        <button
                            onClick={() => setFilter(ParticipantStatus.REJECTED)}
                            className={`px-3 py-1 rounded text-sm ${filter === ParticipantStatus.REJECTED
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            거부됨 ({stats.rejected})
                        </button>
                    </div>
                </div>

                {/* 통계 카드들 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                        <div className="text-sm text-blue-600">총 신청</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                        <div className="text-sm text-yellow-600">대기중</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                        <div className="text-sm text-green-600">승인됨</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                        <div className="text-sm text-red-600">거부됨</div>
                    </div>
                </div>
            </div>

            {/* 참가자 목록 */}
            {filteredParticipants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    {filter === 'all' ? '아직 참가 신청한 팀이 없습니다.' : `${filter} 상태의 팀이 없습니다.`}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredParticipants.map((participant) => (
                        <ParticipantCard
                            key={participant.id}
                            participant={participant}
                            isOwner={isOwner}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onCancel={handleCancel}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ParticipantList; 