'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card } from '@/components/ui';
import { MatchResultForm } from '@/components/match/MatchResultForm';
import { MatchStatistics } from '@/components/stats';
import ShareButton from '@/components/share/ShareButton';
import { showToast } from '@/components/ui/Toast';
import { Match, Team, GameResult, GameDetail, MatchStats, TeamStats, GameStatus } from '@/types';

export default function MatchResultsPage() {
    const params = useParams();
    const router = useRouter();
    const matchId = params.id as string;
    const { user } = useAuth();

    const [match, setMatch] = useState<Match | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [games, setGames] = useState<GameResult[]>([]);
    const [gameDetails, setGameDetails] = useState<Record<string, GameDetail>>({});
    const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
    const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [selectedGame, setSelectedGame] = useState<GameResult | null>(null);
    const [showResultForm, setShowResultForm] = useState(false);

    const fetchMatchData = useCallback(async () => {
        try {
            setLoading(true);

            // 경기 정보 조회
            const { data: matchData, error: matchError } = await supabase
                .from('matches')
                .select(`
                    *,
                    tournament_participants (
                        *,
                        team:teams(*)
                    )
                `)
                .eq('id', matchId)
                .single();

            if (matchError) {
                console.error('Match fetch error:', matchError);
                showToast('경기 정보를 불러올 수 없습니다', 'error');
                return;
            }

            setMatch({
                ...matchData,
                type: matchData.type,
                status: matchData.status,
            });

            // 소유자 확인
            if (user && matchData.creator_id === user.id) {
                setIsOwner(true);
            }

            // 참가 팀 목록
            const participantTeams = matchData.tournament_participants
                ?.filter((p: any) => p.status === 'approved')
                .map((p: any) => p.team)
                .filter(Boolean) || [];
            setTeams(participantTeams);

            // 통계 데이터 생성 (실제로는 DB에서 가져와야 함)
            generateMockStats(matchId, participantTeams);

        } catch (error) {
            console.error('Data fetch error:', error);
            showToast('데이터를 불러오는데 실패했습니다', 'error');
        } finally {
            setLoading(false);
        }
    }, [matchId, user]);

    useEffect(() => {
        fetchMatchData();
    }, [fetchMatchData]);

    // 임시 통계 데이터 생성 (실제 구현 시 DB에서 가져와야 함)
    const generateMockStats = (matchId: string, teams: Team[]) => {
        // 경기 통계
        const mockMatchStats: MatchStats = {
            id: '1',
            match_id: matchId,
            total_games: teams.length * (teams.length - 1) / 2, // Round robin 가정
            completed_games: Math.floor(Math.random() * (teams.length * (teams.length - 1) / 2)),
            total_teams: teams.length,
            active_teams: teams.length,
            total_players: teams.length * 5, // 팀당 5명 가정
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setMatchStats(mockMatchStats);

        // 팀 통계
        const mockTeamStats: TeamStats[] = teams.map(team => {
            const gamesPlayed = Math.floor(Math.random() * 10) + 1;
            const wins = Math.floor(Math.random() * gamesPlayed);
            const losses = Math.floor(Math.random() * (gamesPlayed - wins));
            const draws = gamesPlayed - wins - losses;

            return {
                id: team.id,
                team_id: team.id,
                match_id: matchId,
                games_played: gamesPlayed,
                wins,
                losses,
                draws,
                points_for: Math.floor(Math.random() * 100) + 50,
                points_against: Math.floor(Math.random() * 100) + 40,
                win_rate: gamesPlayed > 0 ? wins / gamesPlayed : 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        });
        setTeamStats(mockTeamStats);

        // 경기 일정 생성
        const mockGames: GameResult[] = [];
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                mockGames.push({
                    id: `game-${i}-${j}`,
                    match_id: matchId,
                    round: 1,
                    game_number: mockGames.length + 1,
                    team1_id: teams[i].id,
                    team2_id: teams[j].id,
                    status: Math.random() > 0.5 ? 'completed' : 'scheduled',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                } as GameResult);
            }
        }
        setGames(mockGames);

        // 완료된 경기의 결과 생성
        const details: Record<string, GameDetail> = {};
        mockGames.filter(g => g.status === 'completed').forEach(game => {
            const team1Score = Math.floor(Math.random() * 5);
            const team2Score = Math.floor(Math.random() * 5);
            details[game.id] = {
                id: `detail-${game.id}`,
                game_id: game.id,
                team1_score: team1Score,
                team2_score: team2Score,
                winner_id: team1Score > team2Score 
                    ? game.team1_id 
                    : team2Score > team1Score 
                    ? game.team2_id 
                    : undefined,
                verified: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        });
        setGameDetails(details);
    };

    const handleGameClick = (game: GameResult) => {
        if (!isOwner) {
            showToast('경기 주최자만 결과를 입력할 수 있습니다', 'warning');
            return;
        }

        setSelectedGame(game);
        setShowResultForm(true);
    };

    const handleSubmitResult = async (result: Partial<GameDetail>) => {
        if (!selectedGame) return;

        try {
            // TODO: 실제 DB에 저장
            setGameDetails(prev => ({
                ...prev,
                [selectedGame.id]: {
                    ...result,
                    id: `detail-${selectedGame.id}`,
                    game_id: selectedGame.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                } as GameDetail,
            }));

            // 경기 상태 업데이트
            setGames(prev => prev.map(g => 
                g.id === selectedGame.id 
                    ? { ...g, status: 'completed' as GameStatus } 
                    : g
            ));

            setShowResultForm(false);
            setSelectedGame(null);
            showToast('경기 결과가 저장되었습니다', 'success');

            // 통계 다시 계산
            fetchMatchData();
        } catch (error) {
            console.error('Save result error:', error);
            showToast('결과 저장에 실패했습니다', 'error');
        }
    };

    const getTeamName = (teamId?: string) => {
        const team = teams.find(t => t.id === teamId);
        return team?.name || '팀 정보 없음';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-match-blue"></div>
            </div>
        );
    }

    if (!match) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">경기를 찾을 수 없습니다</p>
                    <Button
                        onClick={() => router.push('/matches')}
                        variant="primary"
                        className="mt-4"
                    >
                        경기 목록으로 돌아가기
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push(`/matches/${matchId}`)}
                        className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        경기 상세로 돌아가기
                    </button>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{match.title} - 경기 결과 및 통계</h1>
                            <p className="mt-2 text-gray-600">
                                경기 결과를 입력하고 통계를 확인할 수 있습니다.
                            </p>
                        </div>
                        {/* 공유 버튼 */}
                        {teamStats.length > 0 && (
                            <ShareButton
                                match={match}
                                winner={teamStats.sort((a, b) => b.win_rate - a.win_rate)[0] ? 
                                    teams.find(t => t.id === teamStats.sort((a, b) => b.win_rate - a.win_rate)[0].team_id) : undefined
                                }
                                runnerUp={teamStats.sort((a, b) => b.win_rate - a.win_rate)[1] ? 
                                    teams.find(t => t.id === teamStats.sort((a, b) => b.win_rate - a.win_rate)[1].team_id) : undefined
                                }
                                scores={Object.fromEntries(teamStats.map(ts => [ts.team_id, ts.points_for]))}
                                className="ml-4"
                            />
                        )}
                    </div>
                </div>

                {/* 통계 섹션 */}
                {matchStats && teamStats.length > 0 && (
                    <MatchStatistics matchStats={matchStats} teamStats={teamStats} />
                )}

                {/* 경기 일정 및 결과 */}
                <Card className="p-6 mt-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">📅 경기 일정 및 결과</h2>
                    <div className="space-y-3">
                        {games.map(game => {
                            const detail = gameDetails[game.id];
                            const isCompleted = game.status === 'completed' && detail;

                            return (
                                <div
                                    key={game.id}
                                    onClick={() => handleGameClick(game)}
                                    className={`border rounded-lg p-4 ${
                                        isOwner && !isCompleted 
                                            ? 'cursor-pointer hover:bg-gray-50' 
                                            : ''
                                    } ${isCompleted ? 'bg-gray-50' : 'bg-white'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <span className="text-sm text-gray-500">
                                                Round {game.round} - Game {game.game_number}
                                            </span>
                                            <div className="flex items-center space-x-2">
                                                <span className={`font-medium ${
                                                    isCompleted && detail.winner_id === game.team1_id 
                                                        ? 'text-green-600' 
                                                        : ''
                                                }`}>
                                                    {getTeamName(game.team1_id)}
                                                </span>
                                                <span className="text-gray-400">vs</span>
                                                <span className={`font-medium ${
                                                    isCompleted && detail.winner_id === game.team2_id 
                                                        ? 'text-green-600' 
                                                        : ''
                                                }`}>
                                                    {getTeamName(game.team2_id)}
                                                </span>
                                            </div>
                                        </div>

                                        {isCompleted ? (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-lg font-bold">
                                                    {detail.team1_score} - {detail.team2_score}
                                                </span>
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                    완료
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                {isOwner && (
                                                    <Button size="sm" variant="primary">
                                                        결과 입력
                                                    </Button>
                                                )}
                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                    예정
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* 결과 입력 모달 */}
                {showResultForm && selectedGame && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">경기 결과 입력</h2>
                            <MatchResultForm
                                matchId={matchId}
                                gameId={selectedGame.id}
                                team1={teams.find(t => t.id === selectedGame.team1_id)!}
                                team2={teams.find(t => t.id === selectedGame.team2_id)!}
                                onSubmit={handleSubmitResult}
                                onCancel={() => {
                                    setShowResultForm(false);
                                    setSelectedGame(null);
                                }}
                                initialData={gameDetails[selectedGame.id]}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}