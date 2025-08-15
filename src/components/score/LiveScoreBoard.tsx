'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Match, Team } from '@/types';
import { ChevronUp, ChevronDown, Play, Pause, Flag, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

interface LiveScore {
    id: string;
    match_id: string;
    team1_id: string;
    team2_id: string;
    team1_score: number;
    team2_score: number;
    period: string;
    period_time: string;
    status: 'not_started' | 'in_progress' | 'paused' | 'finished';
    scorer_id: string;
    created_at: string;
    updated_at: string;
}

interface LiveScoreBoardProps {
    match: Match;
    team1: Team;
    team2: Team;
    isScorer?: boolean;
}

export const LiveScoreBoard: React.FC<LiveScoreBoardProps> = ({
    match,
    team1,
    team2,
    isScorer = false,
}) => {
    const [liveScore, setLiveScore] = useState<LiveScore | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [timer, setTimer] = useState<number>(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    const fetchLiveScore = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('live_scores')
                .select('*')
                .eq('match_id', match.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching live score:', error);
            }

            if (data) {
                setLiveScore(data);
                // 타이머 복원
                if (data.period_time) {
                    const [minutes, seconds] = data.period_time.split(':').map(Number);
                    setTimer(minutes * 60 + seconds);
                }
                if (data.status === 'in_progress') {
                    setIsTimerRunning(true);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [match.id]);

    // 실시간 스코어 가져오기
    useEffect(() => {
        fetchLiveScore();
        
        // 실시간 구독 설정
        const subscription = supabase
            .channel(`live_score_${match.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'live_scores',
                    filter: `match_id=eq.${match.id}`,
                },
                (payload) => {
                    console.log('Score update:', payload);
                    if (payload.new) {
                        setLiveScore(payload.new as LiveScore);
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [match.id, fetchLiveScore]);

    // 타이머 관리
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (isTimerRunning && liveScore?.status === 'in_progress') {
            interval = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerRunning, liveScore?.status]);

    const initializeLiveScore = async () => {
        setUpdating(true);
        try {
            const { data, error } = await supabase
                .from('live_scores')
                .insert({
                    match_id: match.id,
                    team1_id: team1.id,
                    team2_id: team2.id,
                    team1_score: 0,
                    team2_score: 0,
                    period: '1st',
                    period_time: '00:00',
                    status: 'not_started',
                })
                .select()
                .single();

            if (error) throw error;
            setLiveScore(data);
        } catch (error) {
            console.error('Error initializing live score:', error);
            alert('스코어보드 초기화에 실패했습니다.');
        } finally {
            setUpdating(false);
        }
    };

    const updateScore = async (team: 'team1' | 'team2', increment: number) => {
        if (!liveScore || !isScorer) return;
        
        setUpdating(true);
        try {
            const newScore = {
                ...liveScore,
                [`${team}_score`]: Math.max(0, liveScore[`${team}_score`] + increment),
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('live_scores')
                .update({
                    [`${team}_score`]: newScore[`${team}_score`],
                    period_time: formatTime(timer),
                })
                .eq('id', liveScore.id);

            if (error) throw error;
            setLiveScore(newScore);
        } catch (error) {
            console.error('Error updating score:', error);
            alert('스코어 업데이트에 실패했습니다.');
        } finally {
            setUpdating(false);
        }
    };

    const updateStatus = async (status: LiveScore['status']) => {
        if (!liveScore || !isScorer) return;
        
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('live_scores')
                .update({ 
                    status,
                    period_time: formatTime(timer),
                })
                .eq('id', liveScore.id);

            if (error) throw error;
            
            setLiveScore({ ...liveScore, status });
            
            if (status === 'in_progress') {
                setIsTimerRunning(true);
            } else {
                setIsTimerRunning(false);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('상태 업데이트에 실패했습니다.');
        } finally {
            setUpdating(false);
        }
    };

    const updatePeriod = async (period: string) => {
        if (!liveScore || !isScorer) return;
        
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('live_scores')
                .update({ period })
                .eq('id', liveScore.id);

            if (error) throw error;
            setLiveScore({ ...liveScore, period });
        } catch (error) {
            console.error('Error updating period:', error);
            alert('피리어드 업데이트에 실패했습니다.');
        } finally {
            setUpdating(false);
        }
    };

    const resetTimer = () => {
        setTimer(0);
        setIsTimerRunning(false);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!liveScore && isScorer) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600 mb-4">아직 스코어보드가 없습니다.</p>
                <Button onClick={initializeLiveScore} disabled={updating}>
                    스코어보드 시작하기
                </Button>
            </div>
        );
    }

    if (!liveScore) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600">경기가 아직 시작되지 않았습니다.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-4xl mx-auto">
            {/* 타이머 및 상태 */}
            <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatTime(timer)}
                </div>
                
                {isScorer && (
                    <div className="flex justify-center gap-2 mb-4">
                        {liveScore.status === 'not_started' && (
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => updateStatus('in_progress')}
                                disabled={updating}
                            >
                                <Play className="w-4 h-4 mr-1" />
                                시작
                            </Button>
                        )}
                        
                        {liveScore.status === 'in_progress' && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateStatus('paused')}
                                disabled={updating}
                            >
                                <Pause className="w-4 h-4 mr-1" />
                                일시정지
                            </Button>
                        )}
                        
                        {liveScore.status === 'paused' && (
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => updateStatus('in_progress')}
                                disabled={updating}
                            >
                                <Play className="w-4 h-4 mr-1" />
                                재개
                            </Button>
                        )}
                        
                        {liveScore.status !== 'finished' && liveScore.status !== 'not_started' && (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateStatus('finished')}
                                disabled={updating}
                            >
                                <Flag className="w-4 h-4 mr-1" />
                                종료
                            </Button>
                        )}
                        
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={resetTimer}
                            disabled={updating}
                        >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            리셋
                        </Button>
                    </div>
                )}

                {/* 피리어드 선택 */}
                {isScorer && (
                    <div className="flex justify-center gap-2">
                        {['1st', '2nd', '3rd', '4th', 'OT'].map((period) => (
                            <button
                                key={period}
                                onClick={() => updatePeriod(period)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    liveScore.period === period
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                disabled={updating}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                )}
                
                {!isScorer && (
                    <div className="text-sm text-gray-600">
                        {liveScore.period} • {
                            liveScore.status === 'in_progress' ? '진행중' :
                            liveScore.status === 'paused' ? '일시정지' :
                            liveScore.status === 'finished' ? '종료' : '대기중'
                        }
                    </div>
                )}
            </div>

            {/* 스코어보드 */}
            <div className="grid grid-cols-3 gap-4 items-center">
                {/* Team 1 */}
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {team1.name}
                    </h3>
                    <div className="text-5xl font-bold text-blue-600 mb-4">
                        {liveScore.team1_score}
                    </div>
                    
                    {isScorer && (
                        <div className="flex flex-col gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateScore('team1', 1)}
                                disabled={updating || liveScore.status !== 'in_progress'}
                                className="w-full"
                            >
                                <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateScore('team1', -1)}
                                disabled={updating || liveScore.status !== 'in_progress'}
                                className="w-full"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* VS */}
                <div className="text-center">
                    <span className="text-2xl font-bold text-gray-400">VS</span>
                </div>

                {/* Team 2 */}
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {team2.name}
                    </h3>
                    <div className="text-5xl font-bold text-red-600 mb-4">
                        {liveScore.team2_score}
                    </div>
                    
                    {isScorer && (
                        <div className="flex flex-col gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateScore('team2', 1)}
                                disabled={updating || liveScore.status !== 'in_progress'}
                                className="w-full"
                            >
                                <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateScore('team2', -1)}
                                disabled={updating || liveScore.status !== 'in_progress'}
                                className="w-full"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* 빠른 점수 입력 (모바일 최적화) */}
            {isScorer && liveScore.status === 'in_progress' && (
                <div className="mt-6 border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">빠른 점수 입력</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            {[1, 2, 3].map((points) => (
                                <Button
                                    key={`team1-${points}`}
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => updateScore('team1', points)}
                                    disabled={updating}
                                >
                                    {team1.name} +{points}점
                                </Button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            {[1, 2, 3].map((points) => (
                                <Button
                                    key={`team2-${points}`}
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => updateScore('team2', points)}
                                    disabled={updating}
                                >
                                    {team2.name} +{points}점
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};