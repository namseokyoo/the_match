'use client';

import React from 'react';
import { TournamentBracket as BracketType, BracketMatch } from '@/types/bracket';

interface TournamentBracketProps {
    bracket: BracketType;
    onMatchClick?: (match: BracketMatch) => void;
    isEditable?: boolean;
}

// 라운드 이름 매핑
const getRoundName = (roundIndex: number, totalRounds: number): string => {
    const fromEnd = totalRounds - roundIndex - 1;
    switch (fromEnd) {
        case 0: return '결승';
        case 1: return '준결승';
        case 2: return '8강';
        case 3: return '16강';
        case 4: return '32강';
        case 5: return '64강';
        default: return `Round ${roundIndex + 1}`;
    }
};

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
    bracket,
    onMatchClick,
    isEditable = false,
}) => {
    // 브래킷 높이 계산 (첫 라운드 기준)
    const firstRoundMatches = bracket.rounds[0]?.matches.length || 0;
    const matchHeight = 72; // 매치 박스 높이
    const matchGap = 16; // 매치 간 간격
    const totalHeight = firstRoundMatches * (matchHeight + matchGap);
    
    // 각 라운드별 매치 위치 계산
    const getMatchPosition = (roundIndex: number, matchIndex: number): number => {
        const roundMatches = bracket.rounds[roundIndex].matches.length;
        const spacing = totalHeight / roundMatches;
        return matchIndex * spacing + (spacing - matchHeight) / 2;
    };
    
    const renderMatch = (match: BracketMatch, roundIndex: number, matchIndex: number) => {
        const isCompleted = match.status === 'completed';
        const isInProgress = match.status === 'in_progress';
        const isFinal = roundIndex === bracket.rounds.length - 1;
        
        const team1Name = match.team1?.name || 'TBD';
        const team2Name = match.team2?.name || 'TBD';
        const team1Score = match.team1Score;
        const team2Score = match.team2Score;
        const hasScore = team1Score !== undefined && team2Score !== undefined;
        
        const team1Won = match.winner === match.team1?.id || (hasScore && team1Score > team2Score);
        const team2Won = match.winner === match.team2?.id || (hasScore && team2Score > team1Score);
        
        const matchTop = getMatchPosition(roundIndex, matchIndex);
        
        return (
            <div
                key={match.id}
                className="absolute"
                style={{
                    top: `${matchTop}px`,
                    width: '200px',
                }}
            >
                <div
                    className={`
                        relative bg-white border-2 rounded-lg overflow-hidden transition-all
                        ${isEditable ? 'cursor-pointer hover:shadow-lg hover:border-blue-400' : ''}
                        ${isFinal ? 'border-yellow-500 shadow-lg' : 'border-gray-300'}
                        ${isInProgress ? 'border-orange-500 animate-pulse' : ''}
                        ${isCompleted ? 'border-gray-400' : ''}
                    `}
                    onClick={() => isEditable && onMatchClick?.(match)}
                    style={{ height: `${matchHeight}px` }}
                >
                    {/* 결승전 표시 */}
                    {isFinal && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                            <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                FINAL
                            </span>
                        </div>
                    )}
                    
                    {/* LIVE 표시 */}
                    {isInProgress && (
                        <div className="absolute -top-2 -right-2 z-10">
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                LIVE
                            </span>
                        </div>
                    )}
                    
                    {/* 팀 1 */}
                    <div 
                        className={`
                            flex items-center h-9 px-3 border-b border-gray-200
                            ${team1Won ? 'bg-green-50 font-semibold' : ''}
                            ${hasScore && !team1Won ? 'opacity-50' : ''}
                        `}
                    >
                        {match.team1?.seed && (
                            <span className="text-xs text-gray-500 w-4">{match.team1.seed}</span>
                        )}
                        <span className="flex-1 text-sm truncate ml-2">{team1Name}</span>
                        {hasScore && (
                            <span className={`text-sm font-bold ml-2 ${team1Won ? 'text-green-600' : 'text-gray-500'}`}>
                                {team1Score}
                            </span>
                        )}
                    </div>
                    
                    {/* 팀 2 */}
                    <div 
                        className={`
                            flex items-center h-9 px-3
                            ${team2Won ? 'bg-green-50 font-semibold' : ''}
                            ${hasScore && !team2Won ? 'opacity-50' : ''}
                        `}
                    >
                        {match.team2?.seed && (
                            <span className="text-xs text-gray-500 w-4">{match.team2.seed}</span>
                        )}
                        <span className="flex-1 text-sm truncate ml-2">{team2Name}</span>
                        {hasScore && (
                            <span className={`text-sm font-bold ml-2 ${team2Won ? 'text-green-600' : 'text-gray-500'}`}>
                                {team2Score}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };
    
    // SVG 연결선 렌더링
    const renderConnectors = () => {
        const connectors = [];
        
        for (let roundIndex = 0; roundIndex < bracket.rounds.length - 1; roundIndex++) {
            const currentRound = bracket.rounds[roundIndex];
            const nextRound = bracket.rounds[roundIndex + 1];
            
            for (let nextMatchIndex = 0; nextMatchIndex < nextRound.matches.length; nextMatchIndex++) {
                const match1Index = nextMatchIndex * 2;
                const match2Index = nextMatchIndex * 2 + 1;
                
                if (match1Index < currentRound.matches.length) {
                    const match1Y = getMatchPosition(roundIndex, match1Index) + matchHeight / 2;
                    const match2Y = match2Index < currentRound.matches.length
                        ? getMatchPosition(roundIndex, match2Index) + matchHeight / 2
                        : match1Y;
                    const nextMatchY = getMatchPosition(roundIndex + 1, nextMatchIndex) + matchHeight / 2;
                    
                    const startX = roundIndex * 280 + 200;
                    const midX = startX + 40;
                    const endX = (roundIndex + 1) * 280 - 40;
                    
                    connectors.push(
                        <g key={`connector-${roundIndex}-${nextMatchIndex}`}>
                            {/* 첫 번째 매치에서 나오는 선 */}
                            <line
                                x1={startX}
                                y1={match1Y}
                                x2={midX}
                                y2={match1Y}
                                stroke="#e5e7eb"
                                strokeWidth="2"
                            />
                            {/* 두 번째 매치에서 나오는 선 (있는 경우) */}
                            {match2Index < currentRound.matches.length && (
                                <line
                                    x1={startX}
                                    y1={match2Y}
                                    x2={midX}
                                    y2={match2Y}
                                    stroke="#e5e7eb"
                                    strokeWidth="2"
                                />
                            )}
                            {/* 수직 연결선 */}
                            {match2Index < currentRound.matches.length && (
                                <line
                                    x1={midX}
                                    y1={match1Y}
                                    x2={midX}
                                    y2={match2Y}
                                    stroke="#e5e7eb"
                                    strokeWidth="2"
                                />
                            )}
                            {/* 다음 매치로 가는 선 */}
                            <line
                                x1={midX}
                                y1={nextMatchY}
                                x2={endX}
                                y2={nextMatchY}
                                stroke="#e5e7eb"
                                strokeWidth="2"
                            />
                        </g>
                    );
                }
            }
        }
        
        return connectors;
    };

    return (
        <div className="w-full overflow-x-auto bg-gray-50 rounded-lg p-8">
            <div className="relative" style={{ 
                width: `${bracket.rounds.length * 280}px`,
                height: `${totalHeight}px`,
                minHeight: '400px'
            }}>
                {/* SVG 연결선 */}
                <svg
                    className="absolute inset-0"
                    style={{
                        width: `${bracket.rounds.length * 280}px`,
                        height: `${totalHeight}px`,
                    }}
                >
                    {renderConnectors()}
                </svg>
                
                {/* 라운드별 매치 렌더링 */}
                {bracket.rounds.map((round, roundIndex) => (
                    <div
                        key={round.round}
                        className="absolute"
                        style={{
                            left: `${roundIndex * 280}px`,
                            width: '200px',
                            height: `${totalHeight}px`,
                        }}
                    >
                        {/* 라운드 헤더 */}
                        <div className="absolute -top-8 left-0 right-0 text-center">
                            <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-300">
                                {getRoundName(roundIndex, bracket.rounds.length)}
                            </span>
                        </div>
                        
                        {/* 매치들 */}
                        {round.matches.map((match, matchIndex) =>
                            renderMatch(match, roundIndex, matchIndex)
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TournamentBracket;