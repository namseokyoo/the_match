'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { ParticipantStatus } from '@/types';
import { Button, EmptyState } from '@/components/ui';
import { Users, UserPlus, Check, X, Clock, ChevronDown } from 'lucide-react';
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

interface ImprovedParticipantManagementProps {
    matchId: string;
    isCreator: boolean;
    maxTeams?: number;
    onUpdate?: () => void;
}

export default function ImprovedParticipantManagement({ 
    matchId, 
    isCreator,
    maxTeams = 16,
    onUpdate 
}: ImprovedParticipantManagementProps) {
    const { user } = useAuth();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [applying, setApplying] = useState(false);
    const [userTeams, setUserTeams] = useState<any[]>([]);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [applicationNotes, setApplicationNotes] = useState('');
    const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

    // 실시간 구독 설정
    useEffect(() => {
        const channel = supabase
            .channel(`match-participants:${matchId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'match_participants',
                    filter: `match_id=eq.${matchId}`
                },
                () => {
                    fetchParticipants();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [matchId]);

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

        if (!selectedTeamId) {
            showToast('팀을 선택해주세요', 'error');
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
                    team_id: selectedTeamId,
                    notes: applicationNotes || '열심히 참가하겠습니다!'
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                showToast('경기 참가 신청이 완료되었습니다', 'success');
                setShowApplyModal(false);
                setSelectedTeamId('');
                setApplicationNotes('');
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

    const handleQuickApprove = async (participantId: string) => {
        await handleStatusUpdate(participantId, 'approved');
    };

    const handleQuickReject = async (participantId: string) => {
        const reason = rejectionReasons[participantId] || '';
        await handleStatusUpdate(participantId, 'rejected', reason);
    };

    const handleStatusUpdate = async (participantId: string, newStatus: 'approved' | 'rejected', reason?: string) => {
        if (!user) {
            setError('로그인이 필요합니다.');
            return;
        }

        setProcessingIds(prev => new Set(prev).add(participantId));
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const response = await fetch(
                `/api/matches/${matchId}/participants/${participantId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify({ status: newStatus, reason }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '상태 업데이트에 실패했습니다.');
            }

            showToast(
                newStatus === 'approved' ? '팀을 승인했습니다' : '팀을 거절했습니다',
                'success'
            );
            
            // 목록 새로고침
            await fetchParticipants();
            
            // 부모 컴포넌트에 업데이트 알림
            if (onUpdate) {
                onUpdate();
            }
        } catch (err) {
            console.error('참가자 상태 업데이트 오류:', err);
            setError(err instanceof Error ? err.message : '상태 업데이트에 실패했습니다.');
            showToast('상태 업데이트에 실패했습니다', 'error');
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

    // 신청 가능한 팀 필터링 (이미 신청한 팀 제외)
    const availableTeams = userTeams.filter(team => 
        !participants.some(p => p.team_id === team.id)
    );

    // 승인된 팀 수 확인
    const approvedCount = counts.approved;
    const canApply = approvedCount < maxTeams;

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 참가 현황 카드 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">참가 현황</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {approvedCount}/{maxTeams}팀 참가 중
                        </p>
                    </div>
                    {user && !isCreator && availableTeams.length > 0 && canApply && (
                        <Button
                            onClick={() => setShowApplyModal(true)}
                            variant="primary"
                            size="sm"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            참가 신청
                        </Button>
                    )}
                </div>

                {/* 프로그레스 바 */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(approvedCount / maxTeams) * 100}%` }}
                    />
                </div>
            </div>

            {/* 신청 모달 */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">경기 참가 신청</h3>
                        
                        {/* 팀 선택 */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                참가할 팀 선택
                            </label>
                            <select
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">팀을 선택하세요</option>
                                {availableTeams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 신청 메모 */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                신청 메시지 (선택)
                            </label>
                            <textarea
                                value={applicationNotes}
                                onChange={(e) => setApplicationNotes(e.target.value)}
                                placeholder="주최자에게 전달할 메시지를 입력하세요"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                            />
                        </div>

                        {/* 버튼 */}
                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    setShowApplyModal(false);
                                    setSelectedTeamId('');
                                    setApplicationNotes('');
                                }}
                                variant="secondary"
                                className="flex-1"
                            >
                                취소
                            </Button>
                            <Button
                                onClick={handleApplyToMatch}
                                disabled={applying || !selectedTeamId}
                                variant="primary"
                                className="flex-1"
                            >
                                {applying ? '신청 중...' : '신청하기'}
                            </Button>
                        </div>
                    </div>
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
                        <span className="flex items-center justify-center gap-2">
                            {tab === 'pending' && <Clock className="w-4 h-4" />}
                            {tab === 'approved' && <Check className="w-4 h-4" />}
                            {tab === 'rejected' && <X className="w-4 h-4" />}
                            <span>{
                                tab === 'all' ? '전체' :
                                tab === 'pending' ? '대기중' :
                                tab === 'approved' ? '승인됨' :
                                '거절됨'
                            }</span>
                            <span className="text-xs">({counts[tab]})</span>
                        </span>
                    </button>
                ))}
            </div>

            {/* 참가자 목록 */}
            {filteredParticipants.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title={
                        activeTab === 'all' ? '참가 신청이 없습니다' :
                        activeTab === 'pending' ? '대기중인 신청이 없습니다' :
                        activeTab === 'approved' ? '승인된 팀이 없습니다' :
                        '거부된 신청이 없습니다'
                    }
                    description={
                        activeTab === 'all' ? '아직 이 경기에 참가 신청한 팀이 없습니다' :
                        activeTab === 'pending' ? '검토 대기중인 신청이 없습니다' :
                        activeTab === 'approved' ? '승인된 참가팀이 없습니다' :
                        '거부된 신청 내역이 없습니다'
                    }
                />
            ) : (
                <div className="space-y-3">
                    {filteredParticipants.map((participant) => (
                        <div 
                            key={participant.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
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
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-lg font-bold">
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
                                            px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                                            ${participant.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                              participant.status === 'approved' ? 'bg-green-100 text-green-800' :
                                              'bg-red-100 text-red-800'}
                                        `}>
                                            {participant.status === 'pending' && <Clock className="w-3 h-3" />}
                                            {participant.status === 'approved' && <Check className="w-3 h-3" />}
                                            {participant.status === 'rejected' && <X className="w-3 h-3" />}
                                            {participant.status === 'pending' ? '대기중' :
                                             participant.status === 'approved' ? '승인됨' :
                                             '거절됨'}
                                        </span>
                                    </div>

                                    {/* 신청 메모 */}
                                    {participant.notes && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                                            <span className="font-medium">신청 메모:</span> {participant.notes}
                                        </div>
                                    )}

                                    {/* 거부 사유 입력/표시 */}
                                    {participant.status === 'pending' && isCreator && (
                                        <div className="mt-3">
                                            <input
                                                type="text"
                                                placeholder="거부 사유 입력 (선택)"
                                                value={rejectionReasons[participant.id] || ''}
                                                onChange={(e) => setRejectionReasons(prev => ({
                                                    ...prev,
                                                    [participant.id]: e.target.value
                                                }))}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    )}

                                    {/* 거부 사유 표시 */}
                                    {participant.rejection_reason && (
                                        <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
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
                                {isCreator && participant.status === 'pending' && (
                                    <div className="ml-4 flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => handleQuickApprove(participant.id)}
                                            disabled={processingIds.has(participant.id)}
                                        >
                                            {processingIds.has(participant.id) ? 
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> :
                                                <Check className="w-4 h-4" />
                                            }
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => handleQuickReject(participant.id)}
                                            disabled={processingIds.has(participant.id)}
                                        >
                                            {processingIds.has(participant.id) ? 
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> :
                                                <X className="w-4 h-4" />
                                            }
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}