'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/ui/Toast';

interface Participant {
    id: string;
    match_id: string;
    team_id: string;
    status: 'pending' | 'approved' | 'rejected';
    notes?: string;
    applied_at: string;
    team: {
        id: string;
        name: string;
        captain_name?: string;
        logo_url?: string;
    };
}

interface MatchParticipantsProps {
    matchId: string;
    isCreator: boolean;
    onParticipantUpdate?: () => void;
}

export default function MatchParticipants({ 
    matchId, 
    isCreator,
    onParticipantUpdate 
}: MatchParticipantsProps) {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const { user } = useAuth();

    const fetchParticipants = async () => {
        try {
            const response = await fetch(`/api/matches/${matchId}/participants`);
            const data = await response.json();
            
            if (data.success) {
                setParticipants(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching participants:', error);
            showToast('참가자 목록을 불러오는데 실패했습니다', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (matchId) {
            fetchParticipants();
        }
    }, [matchId]);

    const handleApplyToMatch = async () => {
        if (!user) {
            showToast('로그인이 필요합니다', 'error');
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
                onParticipantUpdate?.();
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

    const handleApproveReject = async (participantId: string, status: 'approved' | 'rejected') => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const response = await fetch(`/api/matches/${matchId}/participants/${participantId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    status,
                    reason: status === 'rejected' ? '참가 요건을 충족하지 못했습니다' : undefined
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                showToast(
                    status === 'approved' ? '참가 신청을 승인했습니다' : '참가 신청을 거절했습니다',
                    'success'
                );
                fetchParticipants();
                onParticipantUpdate?.();
            } else {
                showToast(data.error || '처리에 실패했습니다', 'error');
            }
        } catch (error) {
            console.error('Error updating participant:', error);
            showToast('처리 중 오류가 발생했습니다', 'error');
        }
    };

    const handleRemoveTeam = async (participantId: string, teamName: string) => {
        if (!confirm(`정말로 "${teamName}" 팀을 경기에서 제거하시겠습니까?`)) {
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const response = await fetch(`/api/matches/${matchId}/participants/${participantId}/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    reason: '경기 운영상 제거'
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                showToast(`${teamName} 팀이 경기에서 제거되었습니다`, 'success');
                fetchParticipants();
                onParticipantUpdate?.();
            } else {
                showToast(data.error || '팀 제거에 실패했습니다', 'error');
            }
        } catch (error) {
            console.error('Error removing team:', error);
            showToast('팀 제거 중 오류가 발생했습니다', 'error');
        }
    };

    // 현재 사용자의 팀이 이미 신청했는지 확인
    const hasApplied = participants.some(p => 
        p.team.captain_name === user?.user_metadata?.name || 
        p.team.captain_name === user?.email
    );

    const pendingParticipants = participants.filter(p => p.status === 'pending');
    const approvedParticipants = participants.filter(p => p.status === 'approved');
    const rejectedParticipants = participants.filter(p => p.status === 'rejected');

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 참가 신청 버튼 */}
            {user && !isCreator && !hasApplied && (
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

            {/* 대기 중인 신청 */}
            {isCreator && pendingParticipants.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">대기 중인 참가 신청</h3>
                    <div className="space-y-2">
                        {pendingParticipants.map(participant => (
                            <div key={participant.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{participant.team.name}</p>
                                        <p className="text-sm text-gray-600">
                                            주장: {participant.team.captain_name || '정보 없음'}
                                        </p>
                                        {participant.notes && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                메시지: {participant.notes}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleApproveReject(participant.id, 'approved')}
                                            variant="primary"
                                            size="sm"
                                        >
                                            승인
                                        </Button>
                                        <Button
                                            onClick={() => handleApproveReject(participant.id, 'rejected')}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            거절
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 승인된 팀 */}
            <div>
                <h3 className="text-lg font-semibold mb-3">참가 팀 ({approvedParticipants.length})</h3>
                {approvedParticipants.length === 0 ? (
                    <p className="text-gray-500">아직 참가 팀이 없습니다</p>
                ) : (
                    <div className="space-y-2">
                        {approvedParticipants.map(participant => (
                            <div key={participant.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{participant.team.name}</p>
                                        <p className="text-sm text-gray-600">
                                            주장: {participant.team.captain_name || '정보 없음'}
                                        </p>
                                    </div>
                                    {isCreator && (
                                        <Button
                                            onClick={() => handleRemoveTeam(participant.id, participant.team.name)}
                                            variant="danger"
                                            size="sm"
                                        >
                                            제거
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 거절된 팀 (주최자만 볼 수 있음) */}
            {isCreator && rejectedParticipants.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-500">거절된 신청</h3>
                    <div className="space-y-2">
                        {rejectedParticipants.map(participant => (
                            <div key={participant.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-75">
                                <p className="font-medium text-gray-600">{participant.team.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}