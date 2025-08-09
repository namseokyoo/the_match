'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Game, getBracket, createSingleEliminationBracket, createRoundRobinSchedule } from '@/lib/tournament';
import { Trophy, Calendar, MapPin, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface TournamentBracketProps {
    matchId: string;
    isOrganizer?: boolean;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
    matchId,
    isOrganizer = false,
}) => {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [creating, setCreating] = useState(false);
    const [approvedTeams, setApprovedTeams] = useState<any[]>([]);
    const [matchType, setMatchType] = useState<string>('');

    const fetchBracket = useCallback(async () => {
        try {
            const data = await getBracket(matchId);
            setGames(data);
        } catch (error) {
            console.error('Error fetching bracket:', error);
        } finally {
            setLoading(false);
        }
    }, [matchId]);
    
    const fetchApprovedTeams = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('match_participants')
                .select('team_id, teams!inner(id, name)')
                .eq('match_id', matchId)
                .eq('status', 'approved');
                
            if (error) throw error;
            setApprovedTeams(data || []);
        } catch (error) {
            console.error('Error fetching approved teams:', error);
        }
    }, [matchId]);
    
    const fetchMatchType = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('matches')
                .select('type')
                .eq('id', matchId)
                .single();
                
            if (error) throw error;
            setMatchType(data?.type || '');
        } catch (error) {
            console.error('Error fetching match type:', error);
        }
    }, [matchId]);

    useEffect(() => {
        fetchBracket();
        fetchApprovedTeams();
        fetchMatchType();
    }, [fetchBracket, fetchApprovedTeams, fetchMatchType]);
    
    const handleCreateBracket = async () => {
        if (approvedTeams.length < 2) {
            alert('대진표를 생성하려면 최소 2개 이상의 승인된 팀이 필요합니다.');
            return;
        }
        
        setCreating(true);
        try {
            const teamIds = approvedTeams.map(p => p.team_id);
            
            if (matchType === 'single_elimination') {
                await createSingleEliminationBracket(matchId, teamIds);
            } else if (matchType === 'round_robin') {
                await createRoundRobinSchedule(matchId, teamIds, false);
            } else {
                alert('이 대회 유형은 아직 지원되지 않습니다.');
                return;
            }
            
            await fetchBracket();
            alert('대진표가 성공적으로 생성되었습니다!');
        } catch (error) {
            console.error('Error creating bracket:', error);
            alert('대진표 생성에 실패했습니다.');
        } finally {
            setCreating(false);
        }
    };

    // 라운드별로 게임 그룹화
    const groupGamesByRound = () => {
        const rounds: { [key: number]: Game[] } = {};
        
        games.forEach(game => {
            if (!rounds[game.round]) {
                rounds[game.round] = [];
            }
            rounds[game.round].push(game);
        });
        
        return rounds;
    };

    const getRoundName = (round: number, totalRounds: number) => {
        const roundsFromFinal = totalRounds - round;
        
        switch (roundsFromFinal) {
            case 0:
                return '결승';
            case 1:
                return '준결승';
            case 2:
                return '8강';
            case 3:
                return '16강';
            case 4:
                return '32강';
            default:
                return `${round}라운드`;
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (games.length === 0) {
        return (
            <div className="text-center p-8">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">아직 대진표가 생성되지 않았습니다.</p>
                {isOrganizer && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                            승인된 팀: {approvedTeams.length}개
                        </p>
                        <Button 
                            variant="primary"
                            onClick={handleCreateBracket}
                            disabled={creating || approvedTeams.length < 2}
                        >
                            {creating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    생성 중...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    대진표 생성하기
                                </>
                            )}
                        </Button>
                        {approvedTeams.length < 2 && (
                            <p className="text-xs text-red-600">
                                최소 2개 이상의 팀이 승인되어야 대진표를 생성할 수 있습니다.
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    const rounds = groupGamesByRound();
    const totalRounds = Math.max(...Object.keys(rounds).map(Number));

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">토너먼트 대진표</h2>
            
            {/* 모바일 뷰 */}
            <div className="md:hidden space-y-6">
                {Object.entries(rounds).map(([round, roundGames]) => (
                    <div key={round} className="border-l-4 border-blue-600 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            {getRoundName(Number(round), totalRounds)}
                        </h3>
                        <div className="space-y-3">
                            {roundGames.map((game) => (
                                <GameCard
                                    key={game.id}
                                    game={game}
                                    onSelect={() => setSelectedGame(game)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* 데스크톱 뷰 - 트리 형태 */}
            <div className="hidden md:block overflow-x-auto">
                <div className="flex gap-8 min-w-max">
                    {Object.entries(rounds).map(([round, roundGames]) => (
                        <div key={round} className="flex-shrink-0">
                            <h3 className="text-center font-semibold text-gray-700 mb-4">
                                {getRoundName(Number(round), totalRounds)}
                            </h3>
                            <div 
                                className="space-y-4"
                                style={{
                                    marginTop: `${Math.pow(2, Number(round) - 1) * 40 - 40}px`
                                }}
                            >
                                {roundGames.map((game) => (
                                    <div
                                        key={game.id}
                                        className="relative"
                                        style={{
                                            marginBottom: `${Math.pow(2, Number(round)) * 80 - 80}px`
                                        }}
                                    >
                                        <GameCard
                                            game={game}
                                            onSelect={() => setSelectedGame(game)}
                                        />
                                        
                                        {/* 연결선 */}
                                        {Number(round) < totalRounds && (
                                            <div className="absolute top-1/2 -right-8 w-8 h-px bg-gray-300"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 선택된 게임 상세 정보 */}
            {selectedGame && (
                <GameDetailModal
                    game={selectedGame}
                    isOrganizer={isOrganizer}
                    onClose={() => setSelectedGame(null)}
                />
            )}
        </div>
    );
};

interface GameCardProps {
    game: Game;
    onSelect: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onSelect }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 border-green-300';
            case 'in_progress':
                return 'bg-yellow-100 border-yellow-300 animate-pulse';
            case 'scheduled':
                return 'bg-gray-50 border-gray-300';
            default:
                return 'bg-gray-50 border-gray-300';
        }
    };

    return (
        <div
            className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${getStatusColor(game.status)}`}
            onClick={onSelect}
        >
            <div className="space-y-2">
                {/* Team 1 */}
                <div className="flex items-center justify-between">
                    <span className={`font-medium ${game.winner_id === game.team1_id ? 'text-green-600' : 'text-gray-900'}`}>
                        {game.team1?.name || 'TBD'}
                    </span>
                    {game.status === 'completed' && (
                        <span className="font-bold text-lg">{game.team1_score}</span>
                    )}
                </div>
                
                <div className="flex items-center justify-center text-gray-400">
                    <span className="text-xs">VS</span>
                </div>
                
                {/* Team 2 */}
                <div className="flex items-center justify-between">
                    <span className={`font-medium ${game.winner_id === game.team2_id ? 'text-green-600' : 'text-gray-900'}`}>
                        {game.team2?.name || 'TBD'}
                    </span>
                    {game.status === 'completed' && (
                        <span className="font-bold text-lg">{game.team2_score}</span>
                    )}
                </div>
            </div>
            
            {/* 게임 정보 */}
            <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                {game.scheduled_at && (
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(game.scheduled_at)}
                    </div>
                )}
                {game.venue && (
                    <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {game.venue}
                    </div>
                )}
            </div>
        </div>
    );
};

interface GameDetailModalProps {
    game: Game;
    isOrganizer: boolean;
    onClose: () => void;
}

const GameDetailModal: React.FC<GameDetailModalProps> = ({
    game,
    isOrganizer,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                    경기 상세 정보
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-600">팀</p>
                        <p className="font-medium">
                            {game.team1?.name || 'TBD'} vs {game.team2?.name || 'TBD'}
                        </p>
                    </div>
                    
                    {game.status === 'completed' && (
                        <div>
                            <p className="text-sm text-gray-600">스코어</p>
                            <p className="text-2xl font-bold">
                                {game.team1_score} - {game.team2_score}
                            </p>
                        </div>
                    )}
                    
                    {game.scheduled_at && (
                        <div>
                            <p className="text-sm text-gray-600">일정</p>
                            <p className="font-medium">{formatDate(game.scheduled_at)}</p>
                        </div>
                    )}
                    
                    {game.venue && (
                        <div>
                            <p className="text-sm text-gray-600">장소</p>
                            <p className="font-medium">{game.venue}</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 flex gap-3">
                    {game.status === 'scheduled' && isOrganizer && (
                        <Link href={`/matches/${game.match_id}/games/${game.id}/score`}>
                            <Button variant="primary">
                                스코어 입력
                            </Button>
                        </Link>
                    )}
                    
                    {game.status === 'in_progress' && (
                        <Link href={`/matches/${game.match_id}/games/${game.id}/live`}>
                            <Button variant="primary">
                                실시간 스코어 보기
                            </Button>
                        </Link>
                    )}
                    
                    <Button variant="secondary" onClick={onClose}>
                        닫기
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TournamentBracket;