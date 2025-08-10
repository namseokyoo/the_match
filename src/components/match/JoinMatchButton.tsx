'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Match, MatchParticipant } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface JoinMatchButtonProps {
    match: Match;
    onJoined?: () => void;
    className?: string;
}

const JoinMatchButton: React.FC<JoinMatchButtonProps> = ({
    match,
    onJoined,
    className = '',
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [myParticipation, setMyParticipation] = useState<MatchParticipant | null>(null);
    const [checkingParticipation, setCheckingParticipation] = useState(true);
    const [userTeams, setUserTeams] = useState<any[]>([]);
    const [checkingTeams, setCheckingTeams] = useState(true);

    // 사용자가 주장인 팀 조회
    const fetchUserTeams = useCallback(async () => {
        if (!user) {
            setCheckingTeams(false);
            return;
        }

        try {
            const { data: teams, error } = await supabase
                .from('teams')
                .select('*')
                .eq('captain_id', user.id);
            
            if (error) throw error;
            setUserTeams(teams || []);
        } catch (error) {
            console.error('팀 조회 오류:', error);
        } finally {
            setCheckingTeams(false);
        }
    }, [user]);

    // 현재 사용자의 참가 상태 확인
    const checkMyParticipation = useCallback(async () => {
        if (!user) {
            setCheckingParticipation(false);
            return;
        }

        try {
            const response = await fetch(`/api/matches/${match.id}/participants`);
            const result = await response.json();

            if (response.ok && result.data) {
                // 현재 사용자가 주장인 팀의 참가 신청 찾기
                const myParticipation = result.data.find((participant: MatchParticipant) =>
                    participant.team?.captain_id === user.id
                );
                setMyParticipation(myParticipation || null);
            }
        } catch (error) {
            console.error('참가 상태 확인 오류:', error);
        } finally {
            setCheckingParticipation(false);
        }
    }, [user, match.id]);

    // 참가 신청
    const handleJoin = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        // 팀 주장 확인
        if (userTeams.length === 0) {
            alert('참가 신청하려면 먼저 팀을 생성해야 합니다.\n팀 페이지에서 팀을 생성하신 후 다시 시도해주세요.');
            return;
        }

        // 경기 상태 확인
        if (match.status !== 'registration') {
            alert('현재 참가 신청을 받지 않는 경기입니다.');
            return;
        }

        // 이미 참가한 경우
        if (myParticipation) {
            const statusText = {
                pending: '대기중',
                approved: '승인됨',
                rejected: '거부됨',
            }[myParticipation.status] || myParticipation.status;

            alert(`이미 참가 신청한 경기입니다. (현재 상태: ${statusText})`);
            return;
        }

        const notes = prompt('참가 신청 메모를 입력하세요 (선택사항):') || '';

        try {
            setLoading(true);

            // 세션 토큰 가져오기
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                alert('인증 세션을 가져올 수 없습니다. 다시 로그인해주세요.');
                return;
            }

            const response = await fetch(`/api/matches/${match.id}/participants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    notes: notes.trim() || undefined,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '참가 신청 중 오류가 발생했습니다.');
            }

            alert(result.message || '참가 신청이 완료되었습니다.');

            // 참가 상태 다시 확인
            await checkMyParticipation();

            // 콜백 호출
            onJoined?.();

        } catch (error) {
            console.error('참가 신청 오류:', error);
            alert(error instanceof Error ? error.message : '참가 신청 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 참가 신청 취소
    const handleCancel = async () => {
        if (!user || !myParticipation) return;

        if (!confirm('정말로 참가 신청을 취소하시겠습니까?')) {
            return;
        }

        try {
            setLoading(true);

            // 세션 토큰 가져오기
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                alert('인증 세션을 가져올 수 없습니다. 다시 로그인해주세요.');
                return;
            }

            const response = await fetch(`/api/matches/${match.id}/participants/${myParticipation.team_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '취소 처리 중 오류가 발생했습니다.');
            }

            alert(result.message || '참가 신청을 취소했습니다.');

            // 참가 상태 다시 확인
            await checkMyParticipation();

            // 콜백 호출
            onJoined?.();

        } catch (error) {
            console.error('취소 처리 오류:', error);
            alert(error instanceof Error ? error.message : '취소 처리 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 참가 상태 확인
    useEffect(() => {
        checkMyParticipation();
        fetchUserTeams();
    }, [checkMyParticipation, fetchUserTeams]);

    if (checkingParticipation || checkingTeams) {
        return (
            <Button disabled className={className}>
                상태 확인 중...
            </Button>
        );
    }

    if (!user) {
        return (
            <Button
                onClick={() => window.location.href = '/login'}
                className={className}
            >
                로그인 후 참가 신청
            </Button>
        );
    }

    // 자신이 만든 경기인 경우
    if (match.creator_id === user.id) {
        return (
            <Button disabled className={`opacity-50 ${className}`}>
                경기 주최자는 참가할 수 없습니다
            </Button>
        );
    }

    // 경기가 참가 신청을 받지 않는 상태
    if (match.status !== 'registration') {
        const statusText = {
            draft: '초안 작성 중',
            planning: '계획 중',
            registration: '참가 신청 중',
            in_progress: '진행 중',
            ongoing: '진행 중',
            completed: '완료',
            cancelled: '취소됨',
        }[match.status] || match.status;

        return (
            <Button disabled className={`opacity-50 ${className}`}>
                참가 불가 ({statusText})
            </Button>
        );
    }

    // 이미 참가 신청한 경우
    if (myParticipation) {
        const statusConfig = {
            pending: {
                text: '신청 대기중',
                color: 'bg-yellow-600 hover:bg-yellow-700',
                action: handleCancel,
                actionText: '신청 취소'
            },
            approved: {
                text: '참가 승인됨',
                color: 'bg-green-600 hover:bg-green-700',
                action: null,
                actionText: '승인 완료'
            },
            rejected: {
                text: '참가 거부됨',
                color: 'bg-red-600 hover:bg-red-700',
                action: handleJoin,
                actionText: '다시 신청'
            },
        };

        const config = statusConfig[myParticipation.status];

        return (
            <div className={`flex flex-col space-y-2 ${className}`}>
                <Button
                    disabled={!config.action}
                    onClick={config.action || undefined}
                    loading={loading}
                    className={config.color}
                >
                    {config.actionText}
                </Button>
                <div className="text-sm text-gray-600 text-center">
                    현재 상태: {config.text}
                </div>
                {myParticipation.notes && (
                    <div className="text-xs text-gray-500 text-center">
                        메모: {myParticipation.notes}
                    </div>
                )}
            </div>
        );
    }

    // 팀이 없는 경우
    if (userTeams.length === 0) {
        return (
            <div className={`${className}`}>
                <Button
                    onClick={() => window.location.href = '/teams/create'}
                    className="bg-orange-600 hover:bg-orange-700"
                >
                    팀 생성 후 참가 신청
                </Button>
                <p className="text-sm text-gray-600 mt-2 text-center">
                    경기 참가를 위해 먼저 팀을 생성해주세요
                </p>
            </div>
        );
    }

    // 참가 신청 가능한 경우
    return (
        <Button
            onClick={handleJoin}
            loading={loading}
            className={`bg-blue-600 hover:bg-blue-700 ${className}`}
        >
            🏆 경기 참가 신청
        </Button>
    );
};

export default JoinMatchButton; 