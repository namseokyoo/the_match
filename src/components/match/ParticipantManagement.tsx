'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { ParticipantStatus } from '@/types';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/ui/Toast';

interface Participant {
    id: string;
    match_id: string;
    team_id: string;
    status: ParticipantStatus;
    notes?: string;
    applied_at: string;
    reviewed_at?: string;
    reviewed_by?: string;
    rejection_reason?: string;
    team: {
        id: string;
        name: string;
        logo_url?: string;
        captain_name: string;
        description?: string;
    };
}

interface ParticipantManagementProps {
    matchId: string;
    isCreator: boolean;
    onUpdate?: () => void;
}

export default function ParticipantManagement({ 
    matchId, 
    isCreator,
    onUpdate 
}: ParticipantManagementProps) {
    const { user } = useAuth();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [applying, setApplying] = useState(false);
    const [userTeams, setUserTeams] = useState<any[]>([]);

    const fetchParticipants = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`/api/matches/${matchId}/participants`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '참가자 목록을 불러올 수 없습니다.');
            }

            setParticipants(data.data || []);
        } catch (err) {
            console.error('참가자 목록 조회 오류:', err);
            setError(err instanceof Error ? err.message : '참가자 목록을 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    }, [matchId]);

    const fetchUserTeams = useCallback(async () => {
        if (!user) return;
        
        try {
            const { data: teams } = await supabase
                .from('teams')
                .select('*')
                .eq('captain_id', user.id);
            
            setUserTeams(teams || []);
        } catch (err) {
            console.error('사용자 팀 조회 오류:', err);
        }
    }, [user]);

    useEffect(() => {
        fetchParticipants();
        if (user) {
            fetchUserTeams();
        }
    }, [matchId, user, fetchParticipants, fetchUserTeams]);

    const handleApplyToMatch = async () => {
        if (!user) {
            showToast('로그인이 필요합니다', 'error');
            return;
        }

        if (userTeams.length === 0) {
            showToast('먼저 팀을 생성해야 합니다', 'error');
            return;
        }

        setApplying(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const response = await fetch(`/api/matches/${matchId}/participants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    notes: '열심히 참가하겠습니다!'
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                showToast('경기 참가 신청이 완료되었습니다', 'success');
                fetchParticipants();
                onUpdate?.();
            } else {
                showToast(data.error || '참가 신청에 실패했습니다', 'error');
            }
        } catch (error) {
            console.error('Error applying to match:', error);
            showToast('참가 신청 중 오류가 발생했습니다', 'error');
        } finally {
            setApplying(false);
        }
    };

    const handleStatusUpdate = async (participantId: string, newStatus: 'approved' | 'rejected', reason?: string) => {
        if (!user) {
            setError('로그인이 필요합니다.');
            return;
        }

        setProcessingIds(prev => new Set(prev).add(participantId));
        setError(null);

        try {
            const response = await fetch(
                `/api/matches/${matchId}/participants/${participantId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus, reason }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '상태 업데이트에 실패했습니다.');
            }

            // 목록 새로고침
            await fetchParticipants();
            
            // 부모 컴포넌트에 업데이트 알림
            if (onUpdate) {
                onUpdate();
            }
        } catch (err) {
            console.error('참가자 상태 업데이트 오류:', err);
            setError(err instanceof Error ? err.message : '상태 업데이트에 실패했습니다.');
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(participantId);
                return next;
            });
        }
    };

    const handleRemoveTeam = async (participantId: string, teamName: string) => {
        if (!user || !isCreator) {
            setError('권한이 없습니다.');
            return;
        }

        if (!confirm(`정말로 "${teamName}" 팀을 경기에서 제거하시겠습니까?`)) {
            return;
        }

        setProcessingIds(prev => new Set(prev).add(participantId));
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const response = await fetch(
                `/api/matches/${matchId}/participants/${participantId}/remove`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify({
                        reason: '경기 운영상 제거'
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '팀 제거에 실패했습니다.');
            }

            showToast(`${teamName} 팀이 경기에서 제거되었습니다`, 'success');
            
            // 목록 새로고침
            await fetchParticipants();
            
            // 부모 컴포넌트에 업데이트 알림
            if (onUpdate) {
                onUpdate();
            }
        } catch (err) {
            console.error('팀 제거 오류:', err);
            setError(err instanceof Error ? err.message : '팀 제거에 실패했습니다.');
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(participantId);
                return next;
            });
        }
    };

    const handleDelete = async (participantId: string) => {
        if (!user) {
            setError('로그인이 필요합니다.');
            return;
        }

        if (!confirm('정말 이 참가 신청을 삭제하시겠습니까?')) {
            return;
        }

        setProcessingIds(prev => new Set(prev).add(participantId));
        setError(null);

        try {
            const response = await fetch(
                `/api/matches/${matchId}/participants/${participantId}`,
                {
                    method: 'DELETE',
                    headers: {
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '삭제에 실패했습니다.');
            }

            // 목록 새로고침
            await fetchParticipants();
            
            // 부모 컴포넌트에 업데이트 알림
            if (onUpdate) {
                onUpdate();
            }
        } catch (err) {
            console.error('참가 신청 삭제 오류:', err);
            setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(participantId);
                return next;
            });
        }
    };

    // 탭별 필터링
    const filteredParticipants = participants.filter(p => {
        if (activeTab === 'all') return true;
        return p.status === activeTab;
    });

    // 상태별 카운트
    const counts = {
        all: participants.length,
        pending: participants.filter(p => p.status === 'pending').length,
        approved: participants.filter(p => p.status === 'approved').length,
        rejected: participants.filter(p => p.status === 'rejected').length,
    };

    // 현재 사용자의 팀이 이미 신청했는지 확인
    const hasApplied = participants.some(p => 
        userTeams.some(team => team.id === p.team_id)
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 참가 신청 버튼 */}
            {user && !isCreator && !hasApplied && userTeams.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-3">
                        이 경기에 팀으로 참가하시겠습니까?
                    </p>
                    <Button
                        onClick={handleApplyToMatch}
                        disabled={applying}
                        variant="primary"
                        size="sm"
                    >
                        {applying ? '신청 중...' : '경기 참가 신청'}
                    </Button>
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* 탭 네비게이션 */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors
                            ${activeTab === tab 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900'
                            }
                        `}
                    >
                        <span>{
                            tab === 'all' ? '전체' :
                            tab === 'pending' ? '대기중' :
                            tab === 'approved' ? '승인됨' :
                            '거부됨'
                        }</span>
                        <span className="ml-1 text-xs">({counts[tab]})</span>
                    </button>
                ))}
            </div>

            {/* 참가자 목록 */}
            {filteredParticipants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    {activeTab === 'all' ? '아직 참가 신청이 없습니다.' :
                     activeTab === 'pending' ? '대기중인 신청이 없습니다.' :
                     activeTab === 'approved' ? '승인된 팀이 없습니다.' :
                     '거부된 신청이 없습니다.'}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredParticipants.map((participant) => (
                        <div 
                            key={participant.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        {/* 팀 로고 */}
                                        {participant.team.logo_url ? (
                                            <Image 
                                                src={participant.team.logo_url} 
                                                alt={participant.team.name}
                                                width={48}
                                                height={48}
                                                className="w-12 h-12 rounded-lg object-cover"
                                                unoptimized={true}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                <span className="text-gray-500 text-lg font-bold">
                                                    {participant.team.name[0]}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* 팀 정보 */}
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">
                                                {participant.team.name}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                주장: {participant.team.captain_name}
                                            </p>
                                            {participant.team.description && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {participant.team.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* 상태 배지 */}
                                        <span className={`
                                            px-3 py-1 rounded-full text-xs font-medium
                                            ${participant.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                              participant.status === 'approved' ? 'bg-green-100 text-green-800' :
                                              'bg-red-100 text-red-800'}
                                        `}>
                                            {participant.status === 'pending' ? '대기중' :
                                             participant.status === 'approved' ? '승인됨' :
                                             '거부됨'}
                                        </span>
                                    </div>

                                    {/* 신청 메모 */}
                                    {participant.notes && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                                            <span className="font-medium">신청 메모:</span> {participant.notes}
                                        </div>
                                    )}

                                    {/* 거부 사유 */}
                                    {participant.rejection_reason && (
                                        <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-700">
                                            <span className="font-medium">거부 사유:</span> {participant.rejection_reason}
                                        </div>
                                    )}

                                    {/* 신청 일시 */}
                                    <div className="mt-3 text-xs text-gray-500">
                                        신청일: {new Date(participant.applied_at).toLocaleString('ko-KR')}
                                        {participant.reviewed_at && (
                                            <span className="ml-3">
                                                처리일: {new Date(participant.reviewed_at).toLocaleString('ko-KR')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 액션 버튼 */}
                                {isCreator && (
                                    <div className="ml-4 flex flex-col space-y-2">
                                        {participant.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    onClick={() => handleStatusUpdate(participant.id, 'approved')}
                                                    disabled={processingIds.has(participant.id)}
                                                >
                                                    {processingIds.has(participant.id) ? '처리중...' : '승인'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        const reason = prompt('거부 사유를 입력하세요 (선택사항):');
                                                        handleStatusUpdate(participant.id, 'rejected', reason || undefined);
                                                    }}
                                                    disabled={processingIds.has(participant.id)}
                                                >
                                                    거부
                                                </Button>
                                            </>
                                        )}
                                        {participant.status === 'approved' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => handleRemoveTeam(participant.id, participant.team.name)}
                                                disabled={processingIds.has(participant.id)}
                                            >
                                                팀 제거
                                            </Button>
                                        )}
                                        {participant.status !== 'approved' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => handleDelete(participant.id)}
                                                disabled={processingIds.has(participant.id)}
                                            >
                                                삭제
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 새로고침 버튼 */}
            <div className="flex justify-center pt-4">
                <Button
                    variant="ghost"
                    onClick={fetchParticipants}
                    disabled={loading}
                >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                        />
                    </svg>
                    새로고침
                </Button>
            </div>
        </div>
    );
}