'use client';

import React, { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { GameDetail, Team } from '@/types';

interface MatchResultFormProps {
    matchId: string;
    gameId: string;
    team1: Team;
    team2: Team;
    onSubmit: (_result: Partial<GameDetail>) => void;
    onCancel: () => void;
    initialData?: GameDetail;
}

export const MatchResultForm: React.FC<MatchResultFormProps> = ({
    matchId,
    gameId,
    team1,
    team2,
    onSubmit,
    onCancel,
    initialData,
}) => {
    const [team1Score, setTeam1Score] = useState<number>(initialData?.team1_score || 0);
    const [team2Score, setTeam2Score] = useState<number>(initialData?.team2_score || 0);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const winner_id = team1Score > team2Score 
            ? team1.id 
            : team2Score > team1Score 
            ? team2.id 
            : undefined;

        const gameResult: Partial<GameDetail> = {
            game_id: gameId,
            team1_score: team1Score,
            team2_score: team2Score,
            winner_id,
            verified: true,
            details: {
                match_id: matchId,
                team1_name: team1.name,
                team2_name: team2.name,
            },
        };

        try {
            await onSubmit(gameResult);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                {/* Team 1 Score */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {team1.name}
                    </label>
                    <Input
                        type="number"
                        min={0}
                        value={team1Score.toString()}
                        onChange={(value) => setTeam1Score(parseInt(value) || 0)}
                        placeholder="점수 입력"
                        className="text-center text-2xl font-bold"
                    />
                </div>

                {/* Team 2 Score */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {team2.name}
                    </label>
                    <Input
                        type="number"
                        min={0}
                        value={team2Score.toString()}
                        onChange={(value) => setTeam2Score(parseInt(value) || 0)}
                        placeholder="점수 입력"
                        className="text-center text-2xl font-bold"
                    />
                </div>
            </div>

            {/* Result Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">결과 미리보기</h4>
                <div className="flex items-center justify-center space-x-4">
                    <div className={`text-xl font-bold ${team1Score > team2Score ? 'text-green-600' : 'text-gray-600'}`}>
                        {team1.name}: {team1Score}
                    </div>
                    <span className="text-gray-400">VS</span>
                    <div className={`text-xl font-bold ${team2Score > team1Score ? 'text-green-600' : 'text-gray-600'}`}>
                        {team2.name}: {team2Score}
                    </div>
                </div>
                {team1Score === team2Score && (
                    <p className="text-center text-yellow-600 mt-2">무승부</p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    취소
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    disabled={loading}
                >
                    결과 저장
                </Button>
            </div>
        </form>
    );
};