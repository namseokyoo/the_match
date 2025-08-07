'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/components/ui/Toast';
import { 
    Trophy, 
    Play, 
    Pause, 
    StopCircle, 
    RotateCcw, 
    Plus, 
    Minus,
    Wifi,
    WifiOff,
    Timer,
    ChevronUp,
    ChevronDown,
    X,
    Check,
    AlertCircle,
    Smartphone
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { updateGameResult } from '@/lib/tournament';

interface MobileScoreInputProps {
    game: any;
}

interface ScoreAction {
    team: 'team1' | 'team2';
    delta: number;
    timestamp: number;
}

export default function MobileScoreInput({ game }: MobileScoreInputProps) {
    const router = useRouter();
    const { user } = useAuth();
    
    // 점수 상태
    const [team1Score, setTeam1Score] = useState(game.team1_score || 0);
    const [team2Score, setTeam2Score] = useState(game.team2_score || 0);
    
    // 게임 상태
    const [gameStatus, setGameStatus] = useState<'scheduled' | 'in_progress' | 'completed'>(game.status);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [period, setPeriod] = useState(1);
    
    // UI 상태
    const [isRefereeMode, setIsRefereeMode] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingActions, setPendingActions] = useState<ScoreAction[]>([]);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [lastAction, setLastAction] = useState<ScoreAction | null>(null);
    const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
    
    // 진동 피드백 (지원되는 경우)
    const vibrate = (pattern: number | number[] = 50) => {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    };

    // 온라인 상태 체크
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // 대기 중인 액션 동기화
            syncPendingActions();
        };
        
        const handleOffline = () => {
            setIsOnline(false);
            showToast('오프라인 모드 - 나중에 동기화됩니다', 'warning');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 타이머
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning && gameStatus === 'in_progress') {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, gameStatus]);

    // 실시간 브로드캐스트
    useEffect(() => {
        const channel = supabase.channel(`game:${game.id}`)
            .on('broadcast', { event: 'score_update' }, (payload) => {
                if (payload.payload.updated_by !== user?.id) {
                    setTeam1Score(payload.payload.team1_score);
                    setTeam2Score(payload.payload.team2_score);
                    showToast('스코어 업데이트', 'info');
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [game.id, user?.id]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 점수 변경 with Undo
    const handleScoreChange = useCallback((team: 'team1' | 'team2', delta: number) => {
        if (gameStatus !== 'in_progress') return;
        
        vibrate();
        
        // 이전 Undo 타이머 취소
        if (undoTimeout) {
            clearTimeout(undoTimeout);
        }
        
        const newScore = team === 'team1' 
            ? Math.max(0, team1Score + delta)
            : Math.max(0, team2Score + delta);
        
        if (team === 'team1') {
            setTeam1Score(newScore);
        } else {
            setTeam2Score(newScore);
        }
        
        // Undo를 위한 액션 저장
        const action: ScoreAction = {
            team,
            delta,
            timestamp: Date.now()
        };
        setLastAction(action);
        
        // 3초 후 자동 저장
        const timeout = setTimeout(() => {
            saveScore(
                team === 'team1' ? newScore : team1Score,
                team === 'team2' ? newScore : team2Score
            );
            setLastAction(null);
        }, 3000);
        
        setUndoTimeout(timeout);
    }, [team1Score, team2Score, gameStatus, undoTimeout]);

    // Undo 기능
    const handleUndo = () => {
        if (!lastAction || !undoTimeout) return;
        
        vibrate([100, 50, 100]);
        clearTimeout(undoTimeout);
        
        if (lastAction.team === 'team1') {
            setTeam1Score(Math.max(0, team1Score - lastAction.delta));
        } else {
            setTeam2Score(Math.max(0, team2Score - lastAction.delta));
        }
        
        setLastAction(null);
        setUndoTimeout(null);
        showToast('점수 변경 취소됨', 'info');
    };

    // 점수 저장
    const saveScore = async (t1Score: number, t2Score: number) => {
        if (isOnline) {
            try {
                await supabase
                    .from('games')
                    .update({
                        team1_score: t1Score,
                        team2_score: t2Score,
                    })
                    .eq('id', game.id);
                
                // 브로드캐스트
                const channel = supabase.channel(`game:${game.id}`);
                await channel.send({
                    type: 'broadcast',
                    event: 'score_update',
                    payload: {
                        team1_score: t1Score,
                        team2_score: t2Score,
                        period,
                        timer,
                        updated_by: user?.id
                    }
                });
            } catch (error) {
                console.error('Score save error:', error);
                // 오프라인 큐에 추가
                setPendingActions(prev => [...prev, {
                    team: 'team1',
                    delta: t1Score - game.team1_score,
                    timestamp: Date.now()
                }]);
            }
        } else {
            // 오프라인 저장
            setPendingActions(prev => [...prev, {
                team: 'team1',
                delta: t1Score - game.team1_score,
                timestamp: Date.now()
            }]);
        }
    };

    // 대기 중인 액션 동기화
    const syncPendingActions = async () => {
        if (pendingActions.length === 0) return;
        
        try {
            // 모든 대기 중인 액션 적용
            await supabase
                .from('games')
                .update({
                    team1_score: team1Score,
                    team2_score: team2Score,
                })
                .eq('id', game.id);
            
            setPendingActions([]);
            showToast('오프라인 점수 동기화 완료', 'success');
        } catch (error) {
            console.error('Sync error:', error);
        }
    };

    // 게임 시작
    const handleStartGame = async () => {
        vibrate([100, 50, 100, 50, 100]);
        setGameStatus('in_progress');
        setIsTimerRunning(true);
        
        if (isOnline) {
            await supabase
                .from('games')
                .update({
                    status: 'in_progress',
                    started_at: new Date().toISOString()
                })
                .eq('id', game.id);
        }
        
        showToast('경기 시작!', 'success');
    };

    // 게임 종료
    const handleEndGame = async () => {
        vibrate([200, 100, 200]);
        
        try {
            const winnerId = team1Score > team2Score ? game.team1_id :
                           team2Score > team1Score ? game.team2_id : undefined;
            
            await updateGameResult(game.id, team1Score, team2Score, winnerId);
            
            setGameStatus('completed');
            setIsTimerRunning(false);
            setShowEndConfirm(false);
            
            showToast('경기 종료!', 'success');
            
            setTimeout(() => {
                router.push(`/matches/${game.match_id}`);
            }, 2000);
        } catch (error) {
            console.error('End game error:', error);
            showToast('경기 종료 실패', 'error');
        }
    };

    const isOrganizer = user?.id === game.match.creator_id;

    if (!isOrganizer) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                        대회 주최자만 스코어를 입력할 수 있습니다.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            {/* 헤더 */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 -m-2 active:bg-gray-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="font-bold text-lg">스코어 입력</h1>
                            <p className="text-xs text-gray-500">
                                {game.match.title}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* 온라인 상태 */}
                        <div className={`p-2 rounded-lg ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                        </div>
                        
                        {/* 심판 모드 토글 */}
                        <button
                            onClick={() => setIsRefereeMode(!isRefereeMode)}
                            className={`p-2 rounded-lg ${isRefereeMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
                        >
                            <Smartphone className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                {/* 오프라인 알림 */}
                {!isOnline && pendingActions.length > 0 && (
                    <div className="bg-yellow-50 px-4 py-2 border-t border-yellow-200">
                        <p className="text-xs text-yellow-800">
                            {pendingActions.length}개 변경사항 대기 중
                        </p>
                    </div>
                )}
            </div>

            {/* 타이머 섹션 */}
            <div className="bg-white m-4 rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold font-mono">
                            {formatTime(timer)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                            {period}피리어드
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        {gameStatus === 'scheduled' && (
                            <button
                                onClick={handleStartGame}
                                className="p-4 bg-green-500 text-white rounded-xl active:bg-green-600"
                            >
                                <Play className="w-6 h-6" />
                            </button>
                        )}
                        
                        {gameStatus === 'in_progress' && (
                            <>
                                <button
                                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                                    className="p-4 bg-blue-500 text-white rounded-xl active:bg-blue-600"
                                >
                                    {isTimerRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                </button>
                                <button
                                    onClick={() => {
                                        setTimer(0);
                                        setIsTimerRunning(false);
                                    }}
                                    className="p-4 bg-gray-500 text-white rounded-xl active:bg-gray-600"
                                >
                                    <RotateCcw className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
                
                {/* 피리어드 컨트롤 */}
                {gameStatus === 'in_progress' && (
                    <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
                        <button
                            onClick={() => setPeriod(Math.max(1, period - 1))}
                            className="p-2 active:bg-gray-100 rounded-lg"
                            disabled={period <= 1}
                        >
                            <ChevronDown className="w-5 h-5" />
                        </button>
                        <span className="text-sm text-gray-600">피리어드</span>
                        <button
                            onClick={() => setPeriod(period + 1)}
                            className="p-2 active:bg-gray-100 rounded-lg"
                        >
                            <ChevronUp className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* 스코어 섹션 - 심판 모드 */}
            {isRefereeMode ? (
                <div className="flex-1 px-4 pb-4">
                    <div className="grid grid-cols-2 gap-4 h-full">
                        {/* Team 1 */}
                        <div className="bg-blue-50 rounded-xl p-4 flex flex-col">
                            <div className="text-center mb-4">
                                <h3 className="font-bold text-blue-900 text-lg">
                                    {game.team1?.name || 'Team 1'}
                                </h3>
                            </div>
                            
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-7xl font-bold text-blue-600">
                                    {team1Score}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleScoreChange('team1', -1)}
                                    className="p-6 bg-white rounded-xl active:bg-gray-100 disabled:opacity-50"
                                    disabled={gameStatus !== 'in_progress'}
                                >
                                    <Minus className="w-8 h-8 mx-auto" />
                                </button>
                                <button
                                    onClick={() => handleScoreChange('team1', 1)}
                                    className="p-6 bg-blue-500 text-white rounded-xl active:bg-blue-600 disabled:opacity-50"
                                    disabled={gameStatus !== 'in_progress'}
                                >
                                    <Plus className="w-8 h-8 mx-auto" />
                                </button>
                            </div>
                        </div>

                        {/* Team 2 */}
                        <div className="bg-red-50 rounded-xl p-4 flex flex-col">
                            <div className="text-center mb-4">
                                <h3 className="font-bold text-red-900 text-lg">
                                    {game.team2?.name || 'Team 2'}
                                </h3>
                            </div>
                            
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-7xl font-bold text-red-600">
                                    {team2Score}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleScoreChange('team2', -1)}
                                    className="p-6 bg-white rounded-xl active:bg-gray-100 disabled:opacity-50"
                                    disabled={gameStatus !== 'in_progress'}
                                >
                                    <Minus className="w-8 h-8 mx-auto" />
                                </button>
                                <button
                                    onClick={() => handleScoreChange('team2', 1)}
                                    className="p-6 bg-red-500 text-white rounded-xl active:bg-red-600 disabled:opacity-50"
                                    disabled={gameStatus !== 'in_progress'}
                                >
                                    <Plus className="w-8 h-8 mx-auto" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // 일반 모드 (세로 레이아웃)
                <div className="px-4 pb-4 space-y-4">
                    {/* Team 1 */}
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">
                                    {game.team1?.name || 'Team 1'}
                                </h3>
                                <div className="text-4xl font-bold text-blue-600 mt-2">
                                    {team1Score}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleScoreChange('team1', -1)}
                                    className="p-4 bg-gray-100 rounded-xl active:bg-gray-200"
                                    disabled={gameStatus !== 'in_progress'}
                                >
                                    <Minus className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => handleScoreChange('team1', 1)}
                                    className="p-4 bg-blue-500 text-white rounded-xl active:bg-blue-600"
                                    disabled={gameStatus !== 'in_progress'}
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* VS */}
                    <div className="text-center text-gray-400 font-medium">
                        VS
                    </div>

                    {/* Team 2 */}
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">
                                    {game.team2?.name || 'Team 2'}
                                </h3>
                                <div className="text-4xl font-bold text-red-600 mt-2">
                                    {team2Score}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleScoreChange('team2', -1)}
                                    className="p-4 bg-gray-100 rounded-xl active:bg-gray-200"
                                    disabled={gameStatus !== 'in_progress'}
                                >
                                    <Minus className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => handleScoreChange('team2', 1)}
                                    className="p-4 bg-red-500 text-white rounded-xl active:bg-red-600"
                                    disabled={gameStatus !== 'in_progress'}
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Undo 버튼 (플로팅) */}
            {lastAction && (
                <button
                    onClick={handleUndo}
                    className="fixed bottom-24 right-4 bg-gray-800 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 z-50"
                >
                    <RotateCcw className="w-5 h-5" />
                    <span>실행 취소</span>
                </button>
            )}

            {/* 하단 액션 바 */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40">
                {gameStatus === 'in_progress' ? (
                    <button
                        onClick={() => setShowEndConfirm(true)}
                        className="w-full py-4 bg-red-500 text-white rounded-xl font-bold text-lg active:bg-red-600"
                    >
                        경기 종료
                    </button>
                ) : gameStatus === 'completed' ? (
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                            <Trophy className="w-6 h-6" />
                            <span className="font-bold text-lg">경기 종료</span>
                        </div>
                        <button
                            onClick={() => router.push(`/matches/${game.match_id}`)}
                            className="text-blue-600 underline"
                        >
                            대진표로 돌아가기
                        </button>
                    </div>
                ) : null}
            </div>

            {/* 경기 종료 확인 모달 */}
            {showEndConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <div className="text-center mb-6">
                            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">경기를 종료하시겠습니까?</h3>
                            <p className="text-gray-600">
                                {game.team1?.name}: {team1Score}점<br />
                                {game.team2?.name}: {team2Score}점
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowEndConfirm(false)}
                                className="py-3 bg-gray-100 rounded-xl font-medium active:bg-gray-200"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleEndGame}
                                className="py-3 bg-red-500 text-white rounded-xl font-medium active:bg-red-600"
                            >
                                종료
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}