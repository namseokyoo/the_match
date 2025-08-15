'use client';

import React, { useState } from 'react';
import { MatchResultForm } from './MatchResultForm';
import { useMatchResults } from '@/hooks/useMatchResults';
import { Button } from '@/components/ui';
import { Trophy, Edit2, Trash2, Plus, CheckCircle } from 'lucide-react';
import { Team } from '@/types';

interface MatchResultManagerProps {
    matchId: string;
    teams: Team[];
    isCreator: boolean;
    matchType: string;
    currentRound?: number;
}

export const MatchResultManager: React.FC<MatchResultManagerProps> = ({
    matchId,
    teams,
    isCreator,
    currentRound: _currentRound = 1,
}) => {
    const { results, loading, error, submitResult, deleteResult } = useMatchResults(matchId);
    const [showForm, setShowForm] = useState(false);
    const [editingResult, setEditingResult] = useState<any>(null);
    const [selectedMatch, setSelectedMatch] = useState<{
        round: number;
        matchIndex: number;
        team1: Team;
        team2: Team;
    } | null>(null);

    // 토너먼트 브래킷에서 매치 선택 시 호출
    const _handleMatchSelect = (round: number, matchIndex: number, team1: Team, team2: Team) => {
        setSelectedMatch({ round, matchIndex, team1, team2 });
        setShowForm(true);
        setEditingResult(null);
    };

    // 결과 제출 처리
    const handleSubmitResult = async (result: any) => {
        if (!selectedMatch) return;

        try {
            await submitResult(matchId, {
                ...result,
                round: selectedMatch.round,
                match_index: selectedMatch.matchIndex,
                team1_id: selectedMatch.team1.id,
                team2_id: selectedMatch.team2.id,
            });
            setShowForm(false);
            setSelectedMatch(null);
            setEditingResult(null);
        } catch (err) {
            console.error('Failed to submit result:', err);
        }
    };

    // 결과 수정
    const handleEditResult = (result: any) => {
        const team1 = teams.find(t => t.id === result.team1_id);
        const team2 = teams.find(t => t.id === result.team2_id);
        
        if (team1 && team2) {
            setSelectedMatch({
                round: result.round,
                matchIndex: result.match_index,
                team1,
                team2,
            });
            setEditingResult(result);
            setShowForm(true);
        }
    };

    // 결과 삭제
    const handleDeleteResult = async (gameId: string) => {
        if (window.confirm('정말로 이 경기 결과를 삭제하시겠습니까?')) {
            try {
                await deleteResult(matchId, gameId);
            } catch (err) {
                console.error('Failed to delete result:', err);
            }
        }
    };

    // 라운드별로 결과 그룹화
    const resultsByRound = results.reduce((acc, result) => {
        const round = result.round || 1;
        if (!acc[round]) acc[round] = [];
        acc[round].push(result);
        return acc;
    }, {} as Record<number, typeof results>);

    if (loading && results.length === 0) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary-600" />
                    경기 결과
                </h3>
                {isCreator && (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            setSelectedMatch(null);
                            setEditingResult(null);
                            setShowForm(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        결과 입력
                    </Button>
                )}
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* 결과 입력 폼 */}
            {showForm && selectedMatch && (
                <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-md font-medium mb-4">
                        {editingResult ? '결과 수정' : '결과 입력'} - 
                        Round {selectedMatch.round}, Match {selectedMatch.matchIndex + 1}
                    </h4>
                    <MatchResultForm
                        matchId={matchId}
                        gameId={editingResult?.game_id || `${matchId}_r${selectedMatch.round}_m${selectedMatch.matchIndex}`}
                        team1={selectedMatch.team1}
                        team2={selectedMatch.team2}
                        onSubmit={handleSubmitResult}
                        onCancel={() => {
                            setShowForm(false);
                            setSelectedMatch(null);
                            setEditingResult(null);
                        }}
                        initialData={editingResult}
                    />
                </div>
            )}

            {/* 결과 목록 */}
            {results.length > 0 ? (
                <div className="space-y-4">
                    {Object.entries(resultsByRound).map(([round, roundResults]) => (
                        <div key={round} className="border rounded-lg p-4">
                            <h4 className="font-medium text-sm text-gray-600 mb-3">
                                Round {round}
                            </h4>
                            <div className="space-y-2">
                                {roundResults.map((result) => {
                                    const team1 = teams.find(t => t.id === result.team1_id);
                                    const team2 = teams.find(t => t.id === result.team2_id);
                                    const isTeam1Winner = result.winner_id === result.team1_id;
                                    const isTeam2Winner = result.winner_id === result.team2_id;
                                    
                                    return (
                                        <div
                                            key={result.game_id}
                                            className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                {/* Match Number */}
                                                <span className="text-sm text-gray-500">
                                                    #{result.match_index + 1}
                                                </span>
                                                
                                                {/* Team 1 */}
                                                <div className={`flex items-center gap-2 ${isTeam1Winner ? 'font-semibold text-green-600' : ''}`}>
                                                    <span>{team1?.name || 'Unknown'}</span>
                                                    <span className="text-lg">{result.team1_score}</span>
                                                    {isTeam1Winner && <CheckCircle className="h-4 w-4" />}
                                                </div>
                                                
                                                <span className="text-gray-400">vs</span>
                                                
                                                {/* Team 2 */}
                                                <div className={`flex items-center gap-2 ${isTeam2Winner ? 'font-semibold text-green-600' : ''}`}>
                                                    <span>{team2?.name || 'Unknown'}</span>
                                                    <span className="text-lg">{result.team2_score}</span>
                                                    {isTeam2Winner && <CheckCircle className="h-4 w-4" />}
                                                </div>
                                            </div>
                                            
                                            {/* Actions */}
                                            {isCreator && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditResult(result)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteResult(result.game_id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    아직 입력된 경기 결과가 없습니다.
                    {isCreator && ' 위의 버튼을 클릭하여 결과를 입력해주세요.'}
                </div>
            )}
        </div>
    );
};

export default MatchResultManager;