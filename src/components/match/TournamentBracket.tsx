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

// 매치 간격 계산 함수
const getMatchSpacing = (roundIndex: number): number => {
    // 각 라운드마다 매치 간격이 2배씩 증가
    return Math.pow(2, roundIndex + 1) * 40;
};

// 매치 높이 계산 함수
const getMatchHeight = (): number => {
    return 80; // 매치 박스 높이
};

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
    bracket,
    onMatchClick,
    isEditable = false,
}) => {
    const renderMatch = (match: BracketMatch, roundIndex: number, matchIndex: number, totalRounds: number) => {
        const isCompleted = match.status === 'completed';
        const isInProgress = match.status === 'in_progress';
        const isFinal = roundIndex === totalRounds - 1;
        
        // 팀 정보 결정
        const team1Name = match.team1?.name || 'TBD';
        const team2Name = match.team2?.name || 'TBD';
        const team1Score = match.team1Score;
        const team2Score = match.team2Score;
        const hasScore = team1Score !== undefined && team2Score !== undefined;
        
        // 승자 결정
        const team1Won = match.winner === match.team1?.id || (hasScore && team1Score > team2Score);
        const team2Won = match.winner === match.team2?.id || (hasScore && team2Score > team1Score);
        
        // 매치 위치 계산
        const matchSpacing = getMatchSpacing(roundIndex);
        const matchTop = matchIndex * matchSpacing + (matchSpacing / 2 - 40);
        
        return (
            <div
                key={match.id}
                className="absolute"
                style={{
                    top: `${matchTop}px`,
                    width: '240px',
                }}
            >
                <div
                    className={`relative bg-white border-2 rounded-lg overflow-hidden shadow-sm transition-all duration-300 ${
                        isEditable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''
                    } ${
                        isFinal ? 'border-yellow-400 border-3' : 'border-gray-300'
                    } ${
                        isInProgress ? 'border-yellow-500 shadow-yellow-200 shadow-lg' : ''
                    } ${
                        isCompleted ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => isEditable && onMatchClick?.(match)}
                >
                    {/* 결승전 라벨 */}
                    {isFinal && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider">
                                FINAL
                            </div>
                        </div>
                    )}
                    
                    {/* LIVE 표시 */}
                    {isInProgress && (
                        <div className="absolute -top-2 right-2 z-10">
                            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                LIVE
                            </div>
                        </div>
                    )}
                    
                    {/* Team 1 */}
                    <div className={`flex items-center px-3 py-2 border-b transition-all ${
                        team1Won ? 'bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold' : 
                        hasScore && !team1Won ? 'bg-gray-100 opacity-60' : 
                        'bg-white hover:bg-gray-50'
                    }`}>
                        {match.team1?.seed && (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                                team1Won ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                                {match.team1.seed}
                            </div>
                        )}
                        <div className="flex-1 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                            {team1Name}
                        </div>
                        <div className={`ml-2 px-2 py-1 rounded text-sm font-bold ${
                            team1Won ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                        }`}>
                            {hasScore ? team1Score : '-'}
                        </div>
                    </div>
                    
                    {/* Team 2 */}
                    <div className={`flex items-center px-3 py-2 transition-all ${
                        team2Won ? 'bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold' : 
                        hasScore && !team2Won ? 'bg-gray-100 opacity-60' : 
                        'bg-white hover:bg-gray-50'
                    }`}>
                        {match.team2?.seed && (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                                team2Won ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                                {match.team2.seed}
                            </div>
                        )}
                        <div className="flex-1 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                            {team2Name}
                        </div>
                        <div className={`ml-2 px-2 py-1 rounded text-sm font-bold ${
                            team2Won ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                        }`}>
                            {hasScore ? team2Score : '-'}
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    // SVG 연결선 렌더링
    const renderConnections = (roundIndex: number, totalRounds: number) => {
        if (roundIndex >= totalRounds - 1) return null;
        
        const matchCount = bracket.rounds[roundIndex].matches.length;
        const nextMatchCount = bracket.rounds[roundIndex + 1].matches.length;
        const matchSpacing = getMatchSpacing(roundIndex);
        const nextMatchSpacing = getMatchSpacing(roundIndex + 1);
        
        const connections = [];
        
        for (let i = 0; i < nextMatchCount; i++) {
            const sourceMatch1Index = i * 2;
            const sourceMatch2Index = i * 2 + 1;
            
            if (sourceMatch1Index < matchCount) {
                const source1Y = sourceMatch1Index * matchSpacing + (matchSpacing / 2);
                const source2Y = sourceMatch2Index < matchCount 
                    ? sourceMatch2Index * matchSpacing + (matchSpacing / 2)
                    : source1Y;
                const targetY = i * nextMatchSpacing + (nextMatchSpacing / 2);
                
                connections.push(
                    <g key={`connection-${roundIndex}-${i}`}>
                        {/* 첫 번째 매치에서 나오는 선 */}
                        <line
                            x1="0"
                            y1={source1Y}
                            x2="30"
                            y2={source1Y}
                            stroke="#d1d5db"
                            strokeWidth="2"
                        />
                        {/* 두 번째 매치에서 나오는 선 (있는 경우) */}
                        {sourceMatch2Index < matchCount && (
                            <line
                                x1="0"
                                y1={source2Y}
                                x2="30"
                                y2={source2Y}
                                stroke="#d1d5db"
                                strokeWidth="2"
                            />
                        )}
                        {/* 수직 연결선 */}
                        <line
                            x1="30"
                            y1={source1Y}
                            x2="30"
                            y2={source2Y}
                            stroke="#d1d5db"
                            strokeWidth="2"
                        />
                        {/* 다음 라운드로 가는 선 */}
                        <line
                            x1="30"
                            y1={targetY}
                            x2="60"
                            y2={targetY}
                            stroke="#d1d5db"
                            strokeWidth="2"
                        />
                    </g>
                );
            }
        }
        
        return (
            <svg
                className="absolute"
                style={{
                    left: '240px',
                    top: '0',
                    width: '60px',
                    height: `${Math.max(...bracket.rounds[roundIndex].matches.map((_, idx) => 
                        idx * matchSpacing + matchSpacing
                    ))}px`,
                }}
            >
                {connections}
            </svg>
        );
    };
    
    // 전체 브래킷 높이 계산
    const calculateBracketHeight = () => {
        const firstRoundMatches = bracket.rounds[0]?.matches.length || 0;
        const spacing = getMatchSpacing(0);
        return firstRoundMatches * spacing;
    };

    return (
        <div className="w-full overflow-x-auto bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6">
            <div className="inline-block min-w-max bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8">
                {/* 타이틀 */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Tournament Bracket
                    </h2>
                    <p className="text-gray-600 mt-2">경기 대진표</p>
                </div>
                
                {/* 브래킷 컨테이너 */}
                <div 
                    className="relative flex gap-16"
                    style={{ minHeight: `${calculateBracketHeight()}px` }}
                >
                    {bracket.rounds.map((round, roundIndex) => (
                        <div 
                            key={round.round} 
                            className="relative"
                            style={{ width: '240px' }}
                        >
                            {/* 라운드 헤더 */}
                            <div className="absolute -top-12 left-0 right-0 text-center">
                                <h3 className="inline-block px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-sm font-bold uppercase tracking-wider">
                                    {getRoundName(roundIndex, bracket.rounds.length)}
                                </h3>
                            </div>
                            
                            {/* 매치들 */}
                            <div className="relative" style={{ height: `${calculateBracketHeight()}px` }}>
                                {round.matches.map((match, matchIndex) => 
                                    renderMatch(match, roundIndex, matchIndex, bracket.rounds.length)
                                )}
                            </div>
                            
                            {/* SVG 연결선 */}
                            {renderConnections(roundIndex, bracket.rounds.length)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TournamentBracket;