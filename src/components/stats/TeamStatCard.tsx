'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { TeamStats } from '@/types';

interface TeamStatCardProps {
    stats: TeamStats;
    teamName: string;
    recentResults?: ('win' | 'loss' | 'draw')[];
}

export const TeamStatCard: React.FC<TeamStatCardProps> = ({ stats, teamName, recentResults }) => {
    const winRate = stats.games_played > 0 
        ? (stats.wins / stats.games_played * 100).toFixed(1) 
        : '0.0';
    
    const pointDiff = stats.points_for - stats.points_against;

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{teamName}</h3>
                <span className="text-2xl font-bold text-match-blue">{winRate}%</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-600">전체 경기</p>
                    <p className="text-xl font-semibold text-gray-900">{stats.games_played}</p>
                </div>
                
                <div>
                    <p className="text-sm text-gray-600">승-무-패</p>
                    <p className="text-xl font-semibold">
                        <span className="text-green-600">{stats.wins}</span>
                        <span className="text-gray-400 mx-1">-</span>
                        <span className="text-yellow-600">{stats.draws}</span>
                        <span className="text-gray-400 mx-1">-</span>
                        <span className="text-red-600">{stats.losses}</span>
                    </p>
                </div>

                <div>
                    <p className="text-sm text-gray-600">득점</p>
                    <p className="text-xl font-semibold text-gray-900">{stats.points_for}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-600">실점</p>
                    <p className="text-xl font-semibold text-gray-900">{stats.points_against}</p>
                </div>
            </div>

            {/* 득실차 */}
            <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">득실차</span>
                    <span className={`text-lg font-bold ${
                        pointDiff > 0 ? 'text-green-600' : 
                        pointDiff < 0 ? 'text-red-600' : 
                        'text-gray-600'
                    }`}>
                        {pointDiff > 0 && '+'}{pointDiff}
                    </span>
                </div>
            </div>

            {/* 최근 5경기 폼 */}
            <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">최근 경기 결과</p>
                <div className="flex space-x-1">
                    {recentResults ? (
                        recentResults.slice(-5).map((result: 'win' | 'loss' | 'draw', index: number) => {
                            let bgColor = 'bg-gray-400';
                            let label = 'D';
                            
                            if (result === 'win') {
                                bgColor = 'bg-green-500';
                                label = 'W';
                            } else if (result === 'loss') {
                                bgColor = 'bg-red-500';
                                label = 'L';
                            }
                            
                            return (
                                <span 
                                    key={index}
                                    className={`w-6 h-6 ${bgColor} rounded-full flex items-center justify-center text-white text-xs`}
                                >
                                    {label}
                                </span>
                            );
                        })
                    ) : (
                        <span className="text-xs text-gray-500">경기 기록 없음</span>
                    )}
                </div>
            </div>
        </Card>
    );
};