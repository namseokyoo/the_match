'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { useMatchRealtime } from '@/hooks/useRealtimeUpdates';

interface Score {
    team1: string;
    team2: string;
    score1: number;
    score2: number;
    period?: string;
    time?: string;
}

interface LiveScoreboardProps {
    matchId: string;
    className?: string;
}

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({
    matchId,
    className = '',
}) => {
    const { isConnected, scores, matchData } = useMatchRealtime(matchId);
    const [currentScore, setCurrentScore] = useState<Score>({
        team1: '',
        team2: '',
        score1: 0,
        score2: 0,
    });
    const [events] = useState<any[]>([]);
    const [isLive, setIsLive] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 점수 업데이트 효과
    useEffect(() => {
        if (scores && scores.length > 0) {
            const latestScore = scores[scores.length - 1];
            setCurrentScore(latestScore);
            
            // 점수 변경 시 사운드 재생
            if (audioRef.current) {
                audioRef.current.play().catch(() => {});
            }
            
            // 애니메이션 효과
            const scoreElement = document.getElementById(`score-${matchId}`);
            if (scoreElement) {
                scoreElement.classList.add('score-update-animation');
                setTimeout(() => {
                    scoreElement.classList.remove('score-update-animation');
                }, 1000);
            }
        }
    }, [scores, matchId]);

    // 경기 상태 확인
    useEffect(() => {
        if (matchData) {
            setIsLive(matchData.status === 'in_progress');
        }
    }, [matchData]);

    return (
        <div className={`bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden ${className}`}>
            {/* 연결 상태 표시 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {isLive && (
                            <span className="flex items-center space-x-1">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <span className="text-white text-sm font-medium">LIVE</span>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {isConnected ? (
                            <Wifi className="w-4 h-4 text-white" />
                        ) : (
                            <WifiOff className="w-4 h-4 text-white opacity-50" />
                        )}
                        <span className="text-white text-xs">
                            {isConnected ? '실시간 연결됨' : '연결 끊김'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 점수판 */}
            <div id={`score-${matchId}`} className="p-6">
                <div className="grid grid-cols-3 gap-4 items-center">
                    {/* 팀 1 */}
                    <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">홈</div>
                        <div className="text-xl font-bold text-gray-900 mb-2">
                            {currentScore.team1 || '팀 A'}
                        </div>
                        <div className="text-4xl font-bold text-blue-600">
                            {currentScore.score1}
                        </div>
                    </div>

                    {/* VS */}
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-400">VS</div>
                        {currentScore.period && (
                            <div className="text-sm text-gray-600 mt-2">
                                {currentScore.period}
                            </div>
                        )}
                        {currentScore.time && (
                            <div className="text-lg font-mono text-gray-900 mt-1">
                                {currentScore.time}
                            </div>
                        )}
                    </div>

                    {/* 팀 2 */}
                    <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">원정</div>
                        <div className="text-xl font-bold text-gray-900 mb-2">
                            {currentScore.team2 || '팀 B'}
                        </div>
                        <div className="text-4xl font-bold text-red-600">
                            {currentScore.score2}
                        </div>
                    </div>
                </div>
            </div>

            {/* 경기 이벤트 타임라인 */}
            {events.length > 0 && (
                <div className="border-t border-gray-200 px-4 py-3 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                        {events.map((event, index) => (
                            <div key={index} className="flex items-center space-x-3 text-sm">
                                <span className="text-gray-500 font-mono">
                                    {event.time}'
                                </span>
                                <span className="flex-1">
                                    {event.description}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 오디오 요소 (점수 변경 시 사운드) */}
            <audio ref={audioRef} preload="auto">
                <source src="/sounds/score-update.mp3" type="audio/mpeg" />
            </audio>

            <style jsx>{`
                @keyframes scoreUpdate {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                
                .score-update-animation {
                    animation: scoreUpdate 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

// 미니 스코어보드 (헤더용)
export const MiniLiveScore: React.FC<{ matchId: string }> = ({ matchId }) => {
    const { isConnected, scores } = useMatchRealtime(matchId);
    const [currentScore, setCurrentScore] = useState<Score>({
        team1: '',
        team2: '',
        score1: 0,
        score2: 0,
    });

    useEffect(() => {
        if (scores && scores.length > 0) {
            setCurrentScore(scores[scores.length - 1]);
        }
    }, [scores]);

    if (!isConnected || !currentScore.team1) return null;

    return (
        <div className="inline-flex items-center space-x-3 bg-gray-900 text-white px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-sm">
                {currentScore.team1} {currentScore.score1} - {currentScore.score2} {currentScore.team2}
            </span>
        </div>
    );
};

// 라이브 경기 목록
export const LiveMatchList: React.FC = () => {
    const [liveMatches, setLiveMatches] = useState<any[]>([]);

    useEffect(() => {
        // 라이브 경기 목록 가져오기
        const fetchLiveMatches = async () => {
            const response = await fetch('/api/matches?status=in_progress');
            if (response.ok) {
                const data = await response.json();
                setLiveMatches(data.data || []);
            }
        };

        fetchLiveMatches();
        const interval = setInterval(fetchLiveMatches, 30000); // 30초마다 갱신

        return () => clearInterval(interval);
    }, []);

    if (liveMatches.length === 0) return null;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-red-500" />
                    <span>진행 중인 경기</span>
                </h3>
                <span className="text-sm text-gray-500">
                    {liveMatches.length}개 경기
                </span>
            </div>

            <div className="space-y-3">
                {liveMatches.map((match) => (
                    <a
                        key={match.id}
                        href={`/matches/${match.id}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                    {match.title}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    {match.sport_type} • {match.match_type}
                                </div>
                            </div>
                            <MiniLiveScore matchId={match.id} />
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default LiveScoreboard;