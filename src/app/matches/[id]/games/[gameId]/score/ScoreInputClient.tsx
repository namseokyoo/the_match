'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui';
import { showToast } from '@/components/ui/Toast';
import { Trophy, Play, Pause, StopCircle, RotateCcw, Plus, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { updateGameResult } from '@/lib/tournament';

// 모바일 UI를 동적으로 로드 (코드 스플리팅)
const MobileScoreInput = dynamic(() => import('./MobileScoreInput'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    )
});

interface ScoreInputClientProps {
    game: any;
}

export default function ScoreInputClient({ game }: ScoreInputClientProps) {
    // 모든 Hooks를 먼저 선언
    const router = useRouter();
    const { user } = useAuth();
    const [isMobile, setIsMobile] = useState(false);
    const [team1Score, setTeam1Score] = useState(game.team1_score || 0);
    const [team2Score, setTeam2Score] = useState(game.team2_score || 0);
    const [gameStatus, setGameStatus] = useState<'scheduled' | 'in_progress' | 'completed'>(game.status);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [period, setPeriod] = useState(1);
    const [saving, setSaving] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);

    // 모바일 감지
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor;
            const isMobileDevice = /android|iphone|ipad|ipod|windows phone/i.test(userAgent.toLowerCase());
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 768;
            
            setIsMobile(isMobileDevice || (isTouchDevice && isSmallScreen));
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 타이머 기능
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    // 실시간 업데이트 구독 (라이브 모드일 때만)
    useEffect(() => {
        if (!isLiveMode) return;

        const channel = supabase.channel(`game:${game.id}`)
            .on('broadcast', { event: 'score_update' }, (payload) => {
                console.log('실시간 스코어 업데이트:', payload);
                showToast('스코어가 업데이트되었습니다', 'info');
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [game.id, isLiveMode]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleScoreChange = async (team: 'team1' | 'team2', delta: number) => {
        const newScore = team === 'team1' 
            ? Math.max(0, team1Score + delta)
            : Math.max(0, team2Score + delta);
        
        if (team === 'team1') {
            setTeam1Score(newScore);
        } else {
            setTeam2Score(newScore);
        }

        // 라이브 모드일 때 즉시 브로드캐스트
        if (isLiveMode && gameStatus === 'in_progress') {
            await broadcastScoreUpdate(
                team === 'team1' ? newScore : team1Score,
                team === 'team2' ? newScore : team2Score
            );
        }
    };

    const broadcastScoreUpdate = async (t1Score: number, t2Score: number) => {
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
    };

    const handleStartGame = async () => {
        if (gameStatus === 'scheduled') {
            setGameStatus('in_progress');
            setIsTimerRunning(true);
            
            // 게임 상태 업데이트
            const { error } = await supabase
                .from('games')
                .update({
                    status: 'in_progress',
                    started_at: new Date().toISOString()
                })
                .eq('id', game.id);

            if (error) {
                console.error('게임 시작 오류:', error);
                showToast('게임 시작에 실패했습니다', 'error');
            } else {
                showToast('게임이 시작되었습니다', 'success');
            }
        }
    };

    const handlePauseGame = () => {
        setIsTimerRunning(!isTimerRunning);
    };

    const handleEndGame = async () => {
        if (!window.confirm('정말로 경기를 종료하시겠습니까?')) return;

        setSaving(true);
        try {
            // 승자 결정
            let winnerId = undefined;
            if (team1Score > team2Score) {
                winnerId = game.team1_id;
            } else if (team2Score > team1Score) {
                winnerId = game.team2_id;
            }

            // 게임 결과 업데이트 (토너먼트 진행 포함)
            await updateGameResult(game.id, team1Score, team2Score, winnerId);
            
            setGameStatus('completed');
            setIsTimerRunning(false);
            
            showToast('경기가 종료되었습니다', 'success');
            
            // 2초 후 대진표 페이지로 이동
            setTimeout(() => {
                router.push(`/matches/${game.match_id}?tab=bracket`);
            }, 2000);
        } catch (error) {
            console.error('게임 종료 오류:', error);
            showToast('게임 종료에 실패했습니다', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveScore = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('games')
                .update({
                    team1_score: team1Score,
                    team2_score: team2Score,
                })
                .eq('id', game.id);

            if (error) throw error;
            
            // 라이브 모드일 때 브로드캐스트
            if (isLiveMode) {
                await broadcastScoreUpdate(team1Score, team2Score);
            }
            
            showToast('스코어가 저장되었습니다', 'success');
        } catch (error) {
            console.error('스코어 저장 오류:', error);
            showToast('스코어 저장에 실패했습니다', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleResetTimer = () => {
        setTimer(0);
        setIsTimerRunning(false);
    };

    const isOrganizer = user?.id === game.match.creator_id;

    if (!isOrganizer) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                        대회 주최자만 스코어를 입력할 수 있습니다.
                    </p>
                </div>
            </div>
        );
    }

    // 모바일 디바이스에서는 전용 UI 표시
    if (isMobile) {
        return <MobileScoreInput game={game} />;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* 헤더 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">스코어 입력</h1>
                <p className="text-gray-600">
                    {game.team1?.name} vs {game.team2?.name}
                </p>
            </div>

            {/* 실시간 모드 토글 */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-gray-900">실시간 모드</h3>
                        <p className="text-sm text-gray-600">
                            실시간으로 스코어를 브로드캐스트합니다
                        </p>
                    </div>
                    <button
                        onClick={() => setIsLiveMode(!isLiveMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isLiveMode ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isLiveMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* 타이머 및 피리어드 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">경기 시간</h3>
                        <div className="flex items-center gap-4">
                            <div className="text-3xl font-mono font-bold">
                                {formatTime(timer)}
                            </div>
                            <div className="flex gap-2">
                                {gameStatus === 'scheduled' && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleStartGame}
                                    >
                                        <Play className="w-4 h-4" />
                                    </Button>
                                )}
                                {gameStatus === 'in_progress' && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handlePauseGame}
                                        >
                                            {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleResetTimer}
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">피리어드</h3>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setPeriod(Math.max(1, period - 1))}
                                disabled={period <= 1}
                            >
                                <Minus className="w-4 h-4" />
                            </Button>
                            <div className="text-2xl font-bold px-4">
                                {period}
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setPeriod(period + 1)}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 스코어 입력 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="grid grid-cols-3 gap-4">
                    {/* Team 1 */}
                    <div className="text-center">
                        <h3 className="font-medium text-gray-900 mb-4">
                            {game.team1?.name || 'TBD'}
                        </h3>
                        <div className="text-6xl font-bold text-blue-600 mb-4">
                            {team1Score}
                        </div>
                        <div className="flex justify-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleScoreChange('team1', -1)}
                                disabled={gameStatus === 'completed'}
                            >
                                <Minus className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleScoreChange('team1', 1)}
                                disabled={gameStatus === 'completed'}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* VS */}
                    <div className="flex items-center justify-center">
                        <span className="text-2xl font-medium text-gray-400">VS</span>
                    </div>

                    {/* Team 2 */}
                    <div className="text-center">
                        <h3 className="font-medium text-gray-900 mb-4">
                            {game.team2?.name || 'TBD'}
                        </h3>
                        <div className="text-6xl font-bold text-red-600 mb-4">
                            {team2Score}
                        </div>
                        <div className="flex justify-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleScoreChange('team2', -1)}
                                disabled={gameStatus === 'completed'}
                            >
                                <Minus className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleScoreChange('team2', 1)}
                                disabled={gameStatus === 'completed'}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 상태 표시 */}
                <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            gameStatus === 'scheduled' ? 'bg-gray-100 text-gray-700' :
                            gameStatus === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                            {gameStatus === 'scheduled' ? '예정' :
                             gameStatus === 'in_progress' ? '진행 중' :
                             '종료'}
                        </span>
                        {isLiveMode && gameStatus === 'in_progress' && (
                            <span className="ml-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium animate-pulse">
                                LIVE
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* 액션 버튼 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between">
                    <Button
                        variant="secondary"
                        onClick={() => router.push(`/matches/${game.match_id}?tab=bracket`)}
                    >
                        대진표로 돌아가기
                    </Button>
                    
                    <div className="flex gap-3">
                        {gameStatus === 'in_progress' && (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={handleSaveScore}
                                    disabled={saving}
                                >
                                    {saving ? '저장 중...' : '스코어 저장'}
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={handleEndGame}
                                    disabled={saving}
                                >
                                    <StopCircle className="w-4 h-4 mr-2" />
                                    경기 종료
                                </Button>
                            </>
                        )}
                        {gameStatus === 'completed' && (
                            <div className="flex items-center text-green-600">
                                <Trophy className="w-5 h-5 mr-2" />
                                경기가 종료되었습니다
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}