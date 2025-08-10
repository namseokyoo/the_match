'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { TournamentBracket } from './TournamentBracket';
import { MatchResultManager } from './MatchResultManager';
import { useMatchResults } from '@/hooks/useMatchResults';
import { Team } from '@/types';
import { TournamentBracket as BracketType, BracketMatch } from '@/types/bracket';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Trophy } from 'lucide-react';

interface TournamentManagerProps {
    matchId: string;
    matchData: any;
    teams: Team[];
    isCreator: boolean;
}

export const TournamentManager: React.FC<TournamentManagerProps> = ({
    matchId,
    matchData,
    teams,
    isCreator,
}) => {
    const { results, submitResult } = useMatchResults(matchId);
    const [bracket, setBracket] = useState<BracketType | null>(null);
    const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
    const [showResultForm, setShowResultForm] = useState(false);

    // 브래킷 생성/업데이트
    const generateBracket = useCallback(() => {
        if (!teams || teams.length === 0) return null;

        // 팀 수에 따른 라운드 수 계산
        const numTeams = teams.length;
        const numRounds = Math.ceil(Math.log2(numTeams));
        const totalMatches = Math.pow(2, numRounds) - 1;

        // 브래킷 라운드 생성
        const rounds = [];
        
        for (let roundIndex = 0; roundIndex < numRounds; roundIndex++) {
            const matchesInRound = Math.pow(2, numRounds - roundIndex - 1);
            const roundMatches: BracketMatch[] = [];

            for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
                const gameId = `${matchId}_r${roundIndex + 1}_m${matchIndex}`;
                
                // 결과 찾기
                const result = results.find(r => 
                    r.round === roundIndex + 1 && r.match_index === matchIndex
                );

                // 첫 라운드는 실제 팀 배치
                let team1: Team | undefined;
                let team2: Team | undefined;
                
                if (roundIndex === 0) {
                    const team1Index = matchIndex * 2;
                    const team2Index = matchIndex * 2 + 1;
                    team1 = teams[team1Index];
                    team2 = teams[team2Index];
                } else {
                    // 이전 라운드의 승자들을 가져옴
                    const prevRound = roundIndex - 1;
                    const prevMatch1Index = matchIndex * 2;
                    const prevMatch2Index = matchIndex * 2 + 1;
                    
                    const prevResult1 = results.find(r => 
                        r.round === prevRound + 1 && r.match_index === prevMatch1Index
                    );
                    const prevResult2 = results.find(r => 
                        r.round === prevRound + 1 && r.match_index === prevMatch2Index
                    );
                    
                    if (prevResult1?.winner_id) {
                        team1 = teams.find(t => t.id === prevResult1.winner_id);
                    }
                    if (prevResult2?.winner_id) {
                        team2 = teams.find(t => t.id === prevResult2.winner_id);
                    }
                }

                const match: BracketMatch = {
                    id: gameId,
                    round: roundIndex + 1,
                    matchIndex,
                    team1,
                    team2,
                    team1Score: result?.team1_score,
                    team2Score: result?.team2_score,
                    winner: result?.winner_id || undefined,
                    status: result ? 'completed' : 
                           (team1 && team2) ? 'pending' : 'waiting',
                };

                roundMatches.push(match);
            }

            rounds.push({
                round: roundIndex + 1,
                matches: roundMatches,
            });
        }

        return {
            id: matchId,
            name: matchData.name,
            rounds,
            currentRound: matchData.current_round || 1,
        };
    }, [teams, results, matchId, matchData]);

    // 브래킷 업데이트
    useEffect(() => {
        const newBracket = generateBracket();
        if (newBracket) {
            setBracket(newBracket);
        }
    }, [generateBracket]);

    // 매치 클릭 핸들러
    const handleMatchClick = useCallback((match: BracketMatch) => {
        if (!isCreator) return;
        
        // 팀이 모두 준비된 매치만 결과 입력 가능
        if (match.team1 && match.team2) {
            setSelectedMatch(match);
            setShowResultForm(true);
        }
    }, [isCreator]);

    // 결과 제출 핸들러
    const handleSubmitResult = async (resultData: any) => {
        if (!selectedMatch) return;

        try {
            await submitResult(matchId, {
                game_id: selectedMatch.id,
                round: selectedMatch.round,
                match_index: selectedMatch.matchIndex,
                team1_id: selectedMatch.team1?.id,
                team2_id: selectedMatch.team2?.id,
                team1_score: resultData.team1_score,
                team2_score: resultData.team2_score,
            });

            setShowResultForm(false);
            setSelectedMatch(null);
        } catch (error) {
            console.error('Failed to submit result:', error);
        }
    };

    if (!bracket) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-center">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">대진표를 생성하려면 참가 팀이 필요합니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 토너먼트 브래킷 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        토너먼트 대진표
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <TournamentBracket
                        bracket={bracket}
                        onMatchClick={isCreator ? handleMatchClick : undefined}
                        isEditable={isCreator}
                    />
                </CardContent>
            </Card>

            {/* 결과 입력 폼 (모달) */}
            {showResultForm && selectedMatch && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">경기 결과 입력</h3>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Round {selectedMatch.round}, Match {(selectedMatch.matchIndex || 0) + 1}
                            </p>
                        </div>
                        
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleSubmitResult({
                                    team1_score: parseInt(formData.get('team1_score') as string) || 0,
                                    team2_score: parseInt(formData.get('team2_score') as string) || 0,
                                });
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {selectedMatch.team1?.name || 'Team 1'}
                                </label>
                                <input
                                    type="number"
                                    name="team1_score"
                                    min="0"
                                    defaultValue={selectedMatch.team1Score || 0}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {selectedMatch.team2?.name || 'Team 2'}
                                </label>
                                <input
                                    type="number"
                                    name="team2_score"
                                    min="0"
                                    defaultValue={selectedMatch.team2Score || 0}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResultForm(false);
                                        setSelectedMatch(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    저장
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 경기 결과 관리 */}
            <Card>
                <CardHeader>
                    <CardTitle>경기 결과 기록</CardTitle>
                </CardHeader>
                <CardContent>
                    <MatchResultManager
                        matchId={matchId}
                        teams={teams}
                        isCreator={isCreator}
                        matchType={matchData.match_type}
                        currentRound={matchData.current_round}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default TournamentManager;