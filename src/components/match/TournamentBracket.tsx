'use client';

import React from 'react';
import { TournamentBracket as BracketType, BracketMatch } from '@/types/bracket';

interface TournamentBracketProps {
    bracket: BracketType;
    onMatchClick?: (match: BracketMatch) => void;
    isEditable?: boolean;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
    bracket,
    onMatchClick,
    isEditable = false,
}) => {
    const renderMatch = (match: BracketMatch) => {
        const isCompleted = match.status === 'completed';
        const isInProgress = match.status === 'in_progress';
        
        return (
            <div
                key={match.id}
                className={`bracket-match ${isEditable ? 'cursor-pointer hover:shadow-lg' : ''}`}
                onClick={() => isEditable && onMatchClick?.(match)}
            >
                <div className={`match-container ${
                    isCompleted ? 'bg-gray-50' :
                    isInProgress ? 'bg-yellow-50' :
                    'bg-white'
                } border rounded-lg p-2 mb-2 min-w-[200px]`}>
                    {/* Team 1 */}
                    <div className={`flex justify-between items-center p-2 rounded ${
                        match.winner === match.team1?.id ? 'bg-green-100 font-semibold' : ''
                    }`}>
                        <span className="text-sm">
                            {match.team1?.name || 'TBD'}
                        </span>
                        {match.team1?.score !== undefined && (
                            <span className="font-bold ml-2">{match.team1.score}</span>
                        )}
                    </div>
                    
                    <div className="border-t my-1"></div>
                    
                    {/* Team 2 */}
                    <div className={`flex justify-between items-center p-2 rounded ${
                        match.winner === match.team2?.id ? 'bg-green-100 font-semibold' : ''
                    }`}>
                        <span className="text-sm">
                            {match.team2?.name || 'TBD'}
                        </span>
                        {match.team2?.score !== undefined && (
                            <span className="font-bold ml-2">{match.team2.score}</span>
                        )}
                    </div>
                    
                    {/* Match Status */}
                    {isInProgress && (
                        <div className="text-xs text-center text-yellow-600 mt-1">
                            진행 중
                        </div>
                    )}
                    {isCompleted && !match.winner && (
                        <div className="text-xs text-center text-gray-500 mt-1">
                            무승부
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="tournament-bracket overflow-x-auto">
            <div className="flex space-x-8 p-4">
                {bracket.rounds.map((round, roundIndex) => (
                    <div key={round.round} className="bracket-round">
                        <h3 className="text-lg font-semibold mb-4 text-center">
                            {roundIndex === bracket.rounds.length - 1 
                                ? '결승' 
                                : roundIndex === bracket.rounds.length - 2
                                ? '준결승'
                                : `${round.round}라운드`}
                        </h3>
                        <div className={`flex flex-col justify-around space-y-4`}
                             style={{ minHeight: `${Math.pow(2, bracket.rounds.length - roundIndex) * 100}px` }}>
                            {round.matches.map(match => renderMatch(match))}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* 브라켓 연결선 SVG */}
            <style jsx>{`
                .bracket-round {
                    position: relative;
                }
                
                .bracket-match {
                    position: relative;
                }
                
                .bracket-match::after {
                    content: '';
                    position: absolute;
                    right: -30px;
                    top: 50%;
                    width: 30px;
                    height: 2px;
                    background: #e5e7eb;
                }
                
                .bracket-round:last-child .bracket-match::after {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default TournamentBracket;