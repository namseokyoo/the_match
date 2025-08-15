'use client';

import React from 'react';

interface QuickScoreButtonsProps {
    onScoreChange: (_team: 'team1' | 'team2', _delta: number) => void;
    team: 'team1' | 'team2';
    disabled?: boolean;
    color?: 'blue' | 'red';
}

export default function QuickScoreButtons({ 
    onScoreChange, 
    team, 
    disabled = false,
    color = 'blue' 
}: QuickScoreButtonsProps) {
    
    const colorClasses = {
        blue: {
            bg: 'bg-blue-500 active:bg-blue-600',
            text: 'text-blue-600',
            border: 'border-blue-200'
        },
        red: {
            bg: 'bg-red-500 active:bg-red-600',
            text: 'text-red-600',
            border: 'border-red-200'
        }
    };
    
    const colors = colorClasses[color];
    
    const quickScores = [
        { label: '+1', value: 1 },
        { label: '+2', value: 2 },
        { label: '+3', value: 3 },
    ];
    
    return (
        <div className="space-y-2">
            {/* 빠른 점수 버튼 */}
            <div className="grid grid-cols-3 gap-2">
                {quickScores.map(({ label, value }) => (
                    <button
                        key={value}
                        onClick={() => onScoreChange(team, value)}
                        disabled={disabled}
                        className={`
                            py-4 px-3 rounded-lg font-bold text-white
                            ${colors.bg}
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all transform active:scale-95
                        `}
                    >
                        {label}
                    </button>
                ))}
            </div>
            
            {/* 특수 점수 (농구, 배구 등) */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => onScoreChange(team, -1)}
                    disabled={disabled}
                    className={`
                        py-3 px-3 rounded-lg font-medium
                        bg-gray-100 text-gray-700 active:bg-gray-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all transform active:scale-95
                    `}
                >
                    -1
                </button>
                <button
                    onClick={() => onScoreChange(team, 5)}
                    disabled={disabled}
                    className={`
                        py-3 px-3 rounded-lg font-medium
                        ${colors.bg} text-white
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all transform active:scale-95
                    `}
                >
                    +5
                </button>
            </div>
        </div>
    );
}