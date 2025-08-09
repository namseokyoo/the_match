'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Match, MatchStatus } from '@/types';
import { Button } from '@/components/ui';

interface MatchStatusManagerProps {
    match: Match;
    isCreator: boolean;
    onStatusChange?: (newStatus: MatchStatus) => void;
}

// 상태별 한글 표시 텍스트
const STATUS_LABELS: Record<MatchStatus, string> = {
    [MatchStatus.DRAFT]: '초안',
    [MatchStatus.REGISTRATION]: '참가 신청 중',
    [MatchStatus.IN_PROGRESS]: '진행 중',
    [MatchStatus.COMPLETED]: '완료',
    [MatchStatus.CANCELLED]: '취소됨',
};

// 상태별 색상 클래스
const STATUS_COLORS: Record<MatchStatus, string> = {
    [MatchStatus.DRAFT]: 'bg-gray-100 text-gray-800',
    [MatchStatus.REGISTRATION]: 'bg-blue-100 text-blue-800',
    [MatchStatus.IN_PROGRESS]: 'bg-green-100 text-green-800',
    [MatchStatus.COMPLETED]: 'bg-purple-100 text-purple-800',
    [MatchStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

// 상태 전환 버튼 텍스트
const TRANSITION_ACTIONS: Partial<Record<MatchStatus, string>> = {
    [MatchStatus.REGISTRATION]: '참가 신청 시작',
    [MatchStatus.IN_PROGRESS]: '경기 시작',
    [MatchStatus.COMPLETED]: '경기 종료',
    [MatchStatus.CANCELLED]: '경기 취소',
};

export default function MatchStatusManager({ 
    match, 
    isCreator,
    onStatusChange 
}: MatchStatusManagerProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusInfo, setStatusInfo] = useState<any>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [targetStatus, setTargetStatus] = useState<MatchStatus | null>(null);
    const [cancellationReason, setCancellationReason] = useState('');

    useEffect(() => {
        fetchStatusInfo();
    }, [match.id]);

    const fetchStatusInfo = async () => {
        try {
            const response = await fetch(`/api/matches/${match.id}/status`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '상태 정보를 불러올 수 없습니다.');
            }

            setStatusInfo(data.data);
        } catch (err) {
            console.error('상태 정보 조회 오류:', err);
        }
    };

    const handleStatusChange = async (newStatus: MatchStatus) => {
        // 취소 상태로 변경 시 사유 입력 받기
        if (newStatus === MatchStatus.CANCELLED && !cancellationReason) {
            const reason = prompt('경기 취소 사유를 입력하세요:');
            if (!reason) {
                setError('취소 사유를 입력해야 합니다.');
                return;
            }
            setCancellationReason(reason);
        }

        // 중요한 상태 변경은 확인 대화상자 표시
        if (newStatus === MatchStatus.IN_PROGRESS || 
            newStatus === MatchStatus.COMPLETED || 
            newStatus === MatchStatus.CANCELLED) {
            setTargetStatus(newStatus);
            setShowConfirmDialog(true);
            return;
        }

        await updateStatus(newStatus);
    };

    const updateStatus = async (newStatus: MatchStatus) => {
        if (!user) {
            setError('로그인이 필요합니다.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/matches/${match.id}/status`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        status: newStatus,
                        reason: newStatus === MatchStatus.CANCELLED ? cancellationReason : undefined
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '상태 업데이트에 실패했습니다.');
            }

            // 상태 정보 새로고침
            await fetchStatusInfo();
            
            // 부모 컴포넌트에 알림
            if (onStatusChange) {
                onStatusChange(newStatus);
            }

            // 성공 메시지
            setError(null);
            setShowConfirmDialog(false);
            setTargetStatus(null);
            setCancellationReason('');
        } catch (err) {
            console.error('상태 업데이트 오류:', err);
            setError(err instanceof Error ? err.message : '상태 업데이트에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const confirmStatusChange = () => {
        if (targetStatus) {
            updateStatus(targetStatus);
        }
    };

    const cancelStatusChange = () => {
        setShowConfirmDialog(false);
        setTargetStatus(null);
        setCancellationReason('');
    };

    // 상태 전환 가능 여부 확인
    const canTransitionTo = (status: MatchStatus): boolean => {
        if (!statusInfo) return false;
        
        // 시작하려면 최소 참가자 수 충족 필요
        if (status === MatchStatus.IN_PROGRESS) {
            return statusInfo.requirements?.toStart?.canStart || false;
        }
        
        return statusInfo.allowedTransitions?.includes(status) || false;
    };

    return (
        <div className="space-y-4">
            {/* 현재 상태 표시 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">경기 상태 관리</h3>
                
                <div className="space-y-4">
                    {/* 현재 상태 */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">현재 상태</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[match.status as MatchStatus]}`}>
                            {STATUS_LABELS[match.status as MatchStatus]}
                        </span>
                    </div>

                    {/* 참가자 통계 */}
                    {statusInfo?.participantStats && (
                        <div className="bg-gray-50 rounded p-3">
                            <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex justify-between">
                                    <span>총 참가 신청:</span>
                                    <span className="font-medium">{statusInfo.participantStats.total}팀</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>승인됨:</span>
                                    <span className="font-medium text-green-600">
                                        {statusInfo.participantStats.approved}팀
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>대기중:</span>
                                    <span className="font-medium text-yellow-600">
                                        {statusInfo.participantStats.pending}팀
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 요구사항 */}
                    {statusInfo?.requirements?.toStart && !statusInfo.requirements.toStart.canStart && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                            <p className="text-sm text-yellow-800">
                                ⚠️ 경기를 시작하려면 최소 {statusInfo.requirements.toStart.minParticipants}팀이 필요합니다.
                                (현재 승인: {statusInfo.requirements.toStart.currentApproved}팀)
                            </p>
                        </div>
                    )}

                    {/* 오류 메시지 */}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* 상태 전환 버튼 */}
                    {isCreator && statusInfo?.allowedTransitions && statusInfo.allowedTransitions.length > 0 && (
                        <div className="pt-4 border-t">
                            <p className="text-sm text-gray-600 mb-3">상태 변경</p>
                            <div className="flex flex-wrap gap-2">
                                {statusInfo.allowedTransitions.map((status: MatchStatus) => (
                                    <Button
                                        key={status}
                                        variant={status === MatchStatus.CANCELLED ? 'destructive' : 'primary'}
                                        size="sm"
                                        onClick={() => handleStatusChange(status)}
                                        disabled={loading || !canTransitionTo(status)}
                                    >
                                        {loading ? '처리중...' : (TRANSITION_ACTIONS[status] || STATUS_LABELS[status])}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 타임라인 */}
                    {statusInfo?.timeline && (
                        <div className="pt-4 border-t">
                            <p className="text-sm text-gray-600 mb-2">타임라인</p>
                            <div className="text-xs text-gray-500 space-y-1">
                                {statusInfo.timeline.started && (
                                    <div>시작: {new Date(statusInfo.timeline.started).toLocaleString('ko-KR')}</div>
                                )}
                                {statusInfo.timeline.ended && (
                                    <div>종료: {new Date(statusInfo.timeline.ended).toLocaleString('ko-KR')}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 확인 대화상자 */}
            {showConfirmDialog && targetStatus && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            상태 변경 확인
                        </h3>
                        <p className="text-gray-600 mb-4">
                            정말로 경기 상태를 <strong>{STATUS_LABELS[targetStatus]}</strong>로 변경하시겠습니까?
                            {targetStatus === MatchStatus.CANCELLED && (
                                <span className="block mt-2 text-red-600">
                                    경기가 취소되면 되돌릴 수 없습니다.
                                </span>
                            )}
                            {targetStatus === MatchStatus.COMPLETED && (
                                <span className="block mt-2 text-purple-600">
                                    경기가 종료되면 더 이상 변경할 수 없습니다.
                                </span>
                            )}
                        </p>
                        
                        {targetStatus === MatchStatus.CANCELLED && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    취소 사유
                                </label>
                                <textarea
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    rows={3}
                                    placeholder="취소 사유를 입력하세요..."
                                />
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="ghost"
                                onClick={cancelStatusChange}
                                disabled={loading}
                            >
                                취소
                            </Button>
                            <Button
                                variant={targetStatus === MatchStatus.CANCELLED ? 'destructive' : 'primary'}
                                onClick={confirmStatusChange}
                                disabled={loading || (targetStatus === MatchStatus.CANCELLED && !cancellationReason)}
                            >
                                {loading ? '처리중...' : '확인'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}