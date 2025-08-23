'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui';
import { 
    Play, Pause, StopCircle, Plus, Minus, Trophy, 
    Clock, Users, Wifi, WifiOff, History, ChevronUp, ChevronDown 
} from 'lucide-react';

interface ScoreEvent {
    id: string;
    type: 'goal' | 'penalty' | 'own_goal' | 'yellow_card' | 'red_card' | 'substitution';
    team: 'team1' | 'team2';
    player_name?: string;
    time: number;
    period: number;
    description?: string;
    created_at: string;
}

interface RealTimeScoreInputProps {
    game: any;
    matchId: string;
    isOrganizer: boolean;
}

export default function RealTimeScoreInput({ game, matchId, isOrganizer }: RealTimeScoreInputProps) {
    // State Management
    const [team1Score, setTeam1Score] = useState(game.team1_score || 0);
    const [team2Score, setTeam2Score] = useState(game.team2_score || 0);
    const [gameStatus, setGameStatus] = useState<'scheduled' | 'in_progress' | 'completed'>(game.status);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [period, setPeriod] = useState(1);
    const [isConnected, setIsConnected] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [scoreEvents, setScoreEvents] = useState<ScoreEvent[]>([]);
    const [showEventHistory, setShowEventHistory] = useState(false);
    const [quickScoreType, setQuickScoreType] = useState<'goal' | 'penalty' | 'own_goal'>('goal');

    // 실시간 채널 설정
    useEffect(() => {
        const channel = supabase.channel(`game-live:${game.id}`, {
            config: {
                presence: {
                    key: game.id,
                },
                broadcast: {
                    ack: true,
                },
            },
        });

        // Presence 추적 (시청자 수)
        channel.on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            setViewerCount(Object.keys(state).length);
        });

        // 점수 업데이트 수신
        channel.on('broadcast', { event: 'score_update' }, (payload) => {
            const { team1_score, team2_score, period: newPeriod, timer: newTimer } = payload.payload;
            setTeam1Score(team1_score);
            setTeam2Score(team2_score);
            setPeriod(newPeriod);
            setTimer(newTimer);
            console.log('Score update received:', payload);
        });

        // 이벤트 수신
        channel.on('broadcast', { event: 'game_event' }, (payload) => {
            const event = payload.payload;
            setScoreEvents(prev => [event, ...prev]);
            
            // 점수 이벤트인 경우 점수 업데이트
            if (['goal', 'penalty', 'own_goal'].includes(event.type)) {
                if (event.type === 'own_goal') {
                    // 자책골은 상대팀 점수 증가
                    if (event.team === 'team1') {
                        setTeam2Score((prev: number) => prev + 1);
                    } else {
                        setTeam1Score((prev: number) => prev + 1);
                    }
                } else {
                    // 일반 골, 페널티
                    if (event.team === 'team1') {
                        setTeam1Score((prev: number) => prev + 1);
                    } else {
                        setTeam2Score((prev: number) => prev + 1);
                    }
                }
            }
        });

        // 게임 상태 변경 수신
        channel.on('broadcast', { event: 'status_change' }, (payload) => {
            const { status, isTimerRunning: timerState } = payload.payload;
            setGameStatus(status);
            setIsTimerRunning(timerState);
        });

        // 채널 구독
        channel.subscribe((status) => {
            setIsConnected(status === 'SUBSCRIBED');
            if (status === 'SUBSCRIBED') {
                // Presence 트래킹 시작
                channel.track({
                    user_id: Math.random().toString(36).substring(7),
                    online_at: new Date().toISOString(),
                });
            }
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [game.id]);

    // 타이머 기능
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning && gameStatus === 'in_progress') {
            interval = setInterval(() => {
                setTimer(prev => {
                    const newTime = prev + 1;
                    // 매 10초마다 브로드캐스트
                    if (newTime % 10 === 0) {
                        broadcastScoreUpdate();
                    }
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, gameStatus]);

    // 점수 업데이트 브로드캐스트
    const broadcastScoreUpdate = useCallback(async () => {
        const channel = supabase.channel(`game-live:${game.id}`);
        await channel.send({
            type: 'broadcast',
            event: 'score_update',
            payload: {
                team1_score: team1Score,
                team2_score: team2Score,
                period,
                timer,
                game_id: game.id,
                timestamp: new Date().toISOString(),
            }
        });
    }, [game.id, team1Score, team2Score, period, timer]);

    // 게임 이벤트 브로드캐스트
    const broadcastGameEvent = async (event: Omit<ScoreEvent, 'id' | 'created_at'>) => {
        const fullEvent: ScoreEvent = {
            ...event,
            id: Math.random().toString(36).substring(7),
            created_at: new Date().toISOString(),
        };

        const channel = supabase.channel(`game-live:${game.id}`);
        await channel.send({
            type: 'broadcast',
            event: 'game_event',
            payload: fullEvent
        });

        // 로컬 상태 업데이트
        setScoreEvents(prev => [fullEvent, ...prev]);

        // DB에 저장
        await saveEventToDatabase(fullEvent);
    };

    // 이벤트를 데이터베이스에 저장
    const saveEventToDatabase = async (event: ScoreEvent) => {
        try {
            const { error } = await supabase
                .from('game_events')
                .insert({
                    game_id: game.id,
                    type: event.type,
                    team: event.team,
                    player_name: event.player_name,
                    time: event.time,
                    period: event.period,
                    description: event.description,
                });

            if (error) throw error;
        } catch (error) {
            console.error('Failed to save event:', error);
        }
    };

    // 게임 상태 변경 브로드캐스트
    const broadcastStatusChange = async (status: string, timerState: boolean) => {
        const channel = supabase.channel(`game-live:${game.id}`);
        await channel.send({
            type: 'broadcast',
            event: 'status_change',
            payload: {
                status,
                isTimerRunning: timerState,
                timestamp: new Date().toISOString(),
            }
        });
    };

    // 빠른 점수 추가
    const handleQuickScore = async (team: 'team1' | 'team2') => {
        if (!isOrganizer || gameStatus !== 'in_progress') return;

        const playerName = prompt(`득점 선수 이름을 입력하세요 (${team === 'team1' ? game.team1?.name : game.team2?.name})`);
        
        await broadcastGameEvent({
            type: quickScoreType,
            team,
            player_name: playerName || '미상',
            time: timer,
            period,
            description: `${quickScoreType === 'goal' ? '골' : quickScoreType === 'penalty' ? '페널티골' : '자책골'}`,
        });

        await broadcastScoreUpdate();
        showToast('득점이 기록되었습니다', 'success');
    };

    // 게임 시작
    const handleStartGame = async () => {
        if (!isOrganizer) return;

        setGameStatus('in_progress');
        setIsTimerRunning(true);
        await broadcastStatusChange('in_progress', true);

        // DB 업데이트
        const { error } = await supabase
            .from('games')
            .update({
                status: 'in_progress',
                started_at: new Date().toISOString()
            })
            .eq('id', game.id);

        if (!error) {
            showToast('경기가 시작되었습니다', 'success');
        }
    };

    // 게임 일시정지/재개
    const handlePauseResume = async () => {
        if (!isOrganizer || gameStatus !== 'in_progress') return;

        const newState = !isTimerRunning;
        setIsTimerRunning(newState);
        await broadcastStatusChange('in_progress', newState);
    };

    // 게임 종료
    const handleEndGame = async () => {
        if (!isOrganizer) return;
        if (!window.confirm('정말로 경기를 종료하시겠습니까?')) return;

        setGameStatus('completed');
        setIsTimerRunning(false);
        await broadcastStatusChange('completed', false);

        // 승자 결정
        let winnerId = undefined;
        if (team1Score > team2Score) {
            winnerId = game.team1_id;
        } else if (team2Score > team1Score) {
            winnerId = game.team2_id;
        }

        // DB 업데이트
        const { error } = await supabase
            .from('games')
            .update({
                status: 'completed',
                team1_score: team1Score,
                team2_score: team2Score,
                winner_id: winnerId,
                ended_at: new Date().toISOString()
            })
            .eq('id', game.id);

        if (!error) {
            showToast('경기가 종료되었습니다', 'success');
        }
    };

    // 시간 포맷팅
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 점수 수동 조정
    const handleManualScoreChange = async (team: 'team1' | 'team2', delta: number) => {
        if (!isOrganizer || gameStatus === 'completed') return;

        if (team === 'team1') {
            const newScore = Math.max(0, team1Score + delta);
            setTeam1Score(newScore);
        } else {
            const newScore = Math.max(0, team2Score + delta);
            setTeam2Score(newScore);
        }

        await broadcastScoreUpdate();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-4">
            {/* 연결 상태 바 */}
            <div className="bg-white rounded-lg shadow-sm border p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isConnected ? (
                            <>
                                <Wifi className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-600">실시간 연결됨</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-5 h-5 text-red-600" />
                                <span className="text-sm font-medium text-red-600">연결 끊김</span>
                            </>
                        )}
                        <span className="text-sm text-gray-600">|</span>
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">{viewerCount}명 시청 중</span>
                    </div>
                    {gameStatus === 'in_progress' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium animate-pulse">
                            LIVE
                        </span>
                    )}
                </div>
            </div>

            {/* 메인 스코어보드 */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-lg shadow-lg p-6 text-white">
                {/* 경기 정보 */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">{game.match?.title}</h2>
                    <div className="flex items-center justify-center gap-4">
                        <span className="text-lg">Period {period}</span>
                        <span className="text-3xl font-mono font-bold">{formatTime(timer)}</span>
                        {isTimerRunning && (
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </div>
                </div>

                {/* 스코어 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Team 1 */}
                    <div className="text-center">
                        <h3 className="text-lg font-medium mb-2">{game.team1?.name || 'TBD'}</h3>
                        <div className="text-6xl font-bold">{team1Score}</div>
                        {isOrganizer && gameStatus === 'in_progress' && (
                            <div className="flex justify-center gap-2 mt-3">
                                <button
                                    onClick={() => handleManualScoreChange('team1', -1)}
                                    className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleQuickScore('team1')}
                                    className="px-3 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    득점
                                </button>
                                <button
                                    onClick={() => handleManualScoreChange('team1', 1)}
                                    className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* VS */}
                    <div className="flex items-center justify-center">
                        <span className="text-3xl font-medium opacity-50">VS</span>
                    </div>

                    {/* Team 2 */}
                    <div className="text-center">
                        <h3 className="text-lg font-medium mb-2">{game.team2?.name || 'TBD'}</h3>
                        <div className="text-6xl font-bold">{team2Score}</div>
                        {isOrganizer && gameStatus === 'in_progress' && (
                            <div className="flex justify-center gap-2 mt-3">
                                <button
                                    onClick={() => handleManualScoreChange('team2', -1)}
                                    className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleQuickScore('team2')}
                                    className="px-3 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    득점
                                </button>
                                <button
                                    onClick={() => handleManualScoreChange('team2', 1)}
                                    className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 컨트롤 버튼 */}
                {isOrganizer && (
                    <div className="flex justify-center gap-3">
                        {gameStatus === 'scheduled' && (
                            <Button
                                onClick={handleStartGame}
                                variant="primary"
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                경기 시작
                            </Button>
                        )}
                        {gameStatus === 'in_progress' && (
                            <>
                                <Button
                                    onClick={handlePauseResume}
                                    variant="secondary"
                                    className="bg-white/20 hover:bg-white/30"
                                >
                                    {isTimerRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                    {isTimerRunning ? '일시정지' : '재개'}
                                </Button>
                                <Button
                                    onClick={() => setPeriod(prev => prev + 1)}
                                    variant="secondary"
                                    className="bg-white/20 hover:bg-white/30"
                                >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Period 변경
                                </Button>
                                <Button
                                    onClick={handleEndGame}
                                    variant="danger"
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    <StopCircle className="w-4 h-4 mr-2" />
                                    경기 종료
                                </Button>
                            </>
                        )}
                        {gameStatus === 'completed' && (
                            <div className="flex items-center text-green-400">
                                <Trophy className="w-5 h-5 mr-2" />
                                경기 종료
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 득점 타입 선택 (주최자용) */}
            {isOrganizer && gameStatus === 'in_progress' && (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">득점 타입</h3>
                    <div className="flex gap-2">
                        {[
                            { value: 'goal', label: '일반 골' },
                            { value: 'penalty', label: '페널티' },
                            { value: 'own_goal', label: '자책골' }
                        ].map(type => (
                            <button
                                key={type.value}
                                onClick={() => setQuickScoreType(type.value as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    quickScoreType === type.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 이벤트 히스토리 */}
            <div className="bg-white rounded-lg shadow-sm border">
                <button
                    onClick={() => setShowEventHistory(!showEventHistory)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">경기 이벤트</span>
                        <span className="text-sm text-gray-600">({scoreEvents.length})</span>
                    </div>
                    {showEventHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {showEventHistory && (
                    <div className="border-t max-h-64 overflow-y-auto">
                        {scoreEvents.length === 0 ? (
                            <p className="p-4 text-center text-gray-500">아직 이벤트가 없습니다</p>
                        ) : (
                            <div className="divide-y">
                                {scoreEvents.map(event => (
                                    <div key={event.id} className="p-3 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-mono text-gray-600">
                                                    {Math.floor(event.time / 60)}\'
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    event.team === 'team1' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {event.team === 'team1' ? game.team1?.name : game.team2?.name}
                                                </span>
                                                <span className="text-sm text-gray-900">
                                                    {event.description}
                                                </span>
                                                {event.player_name && (
                                                    <span className="text-sm font-medium text-gray-700">
                                                        - {event.player_name}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                Period {event.period}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}