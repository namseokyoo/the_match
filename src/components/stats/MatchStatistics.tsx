'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { MatchStats, TeamStats } from '@/types';

interface MatchStatisticsProps {
    matchStats: MatchStats;
    teamStats: TeamStats[];
}

export const MatchStatistics: React.FC<MatchStatisticsProps> = ({
    matchStats,
    teamStats,
}) => {
    const sortedTeams = [...teamStats].sort((a, b) => {
        // 승률 우선, 같으면 승수, 그 다음 득점
        if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.points_for - a.points_for;
    });

    return (
        <div className="space-y-6">
            {/* 경기 개요 통계 */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📊 경기 통계</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-match-blue">
                            {matchStats.total_games}
                        </div>
                        <div className="text-sm text-gray-600">전체 경기</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                            {matchStats.completed_games}
                        </div>
                        <div className="text-sm text-gray-600">완료된 경기</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                            {matchStats.total_teams}
                        </div>
                        <div className="text-sm text-gray-600">참가 팀</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">
                            {matchStats.total_players}
                        </div>
                        <div className="text-sm text-gray-600">참가 선수</div>
                    </div>
                </div>

                {/* 진행률 바 */}
                <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>진행률</span>
                        <span>
                            {matchStats.total_games > 0
                                ? Math.round((matchStats.completed_games / matchStats.total_games) * 100)
                                : 0}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-match-blue h-2 rounded-full transition-all duration-300"
                            style={{
                                width: `${
                                    matchStats.total_games > 0
                                        ? (matchStats.completed_games / matchStats.total_games) * 100
                                        : 0
                                }%`,
                            }}
                        />
                    </div>
                </div>
            </Card>

            {/* 팀 순위표 */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 팀 순위</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    순위
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    팀
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    경기
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    승
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    무
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    패
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    득점
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    실점
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    득실차
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    승률
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedTeams.map((team, index) => (
                                <tr key={team.id} className={index < 3 ? 'bg-yellow-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {index + 1}
                                        {index === 0 && ' 🥇'}
                                        {index === 1 && ' 🥈'}
                                        {index === 2 && ' 🥉'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        팀 {team.team_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                        {team.games_played}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 font-medium">
                                        {team.wins}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-yellow-600 font-medium">
                                        {team.draws}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 font-medium">
                                        {team.losses}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                        {team.points_for}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                        {team.points_against}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                                        <span
                                            className={
                                                team.points_for - team.points_against > 0
                                                    ? 'text-green-600'
                                                    : team.points_for - team.points_against < 0
                                                    ? 'text-red-600'
                                                    : 'text-gray-900'
                                            }
                                        >
                                            {team.points_for - team.points_against > 0 && '+'}
                                            {team.points_for - team.points_against}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                                        {(team.win_rate * 100).toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};