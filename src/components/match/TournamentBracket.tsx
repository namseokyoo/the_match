'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TournamentBracket as BracketType, BracketMatch } from '@/types/bracket';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';

interface TournamentBracketProps {
    bracket: BracketType;
    onMatchClick?: (_match: BracketMatch) => void;
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
    const isMobile = useIsMobile();
    const isTablet = useIsTablet();
    const _isDesktop = useIsDesktop();
    const [activeRound, setActiveRound] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    // 스크롤 위치 초기화
    useEffect(() => {
        if (scrollContainerRef.current && !isMobile) {
            scrollContainerRef.current.scrollLeft = 0;
        }
    }, [isMobile]);
    // 반응형 크기 설정
    const matchHeight = isMobile ? 80 : 72;
    const matchWidth = isMobile ? '100%' : isTablet ? 180 : 200;
    const roundGap = isMobile ? 0 : isTablet ? 60 : 80;
    const matchGap = isMobile ? 12 : 16;
    
    // 브래킷 높이 계산 (첫 라운드 기준)
    const firstRoundMatches = bracket.rounds[0]?.matches.length || 0;
    const totalHeight = isMobile ? 'auto' : firstRoundMatches * (matchHeight + matchGap);
    
    // 각 라운드별 매치 위치 계산
    const getMatchPosition = (roundIndex: number, matchIndex: number): number => {
        const roundMatches = bracket.rounds[roundIndex].matches.length;
        const height = typeof totalHeight === 'string' ? firstRoundMatches * (matchHeight + matchGap) : totalHeight;
        const spacing = height / roundMatches;
        return matchIndex * spacing + (spacing - matchHeight) / 2;
    };
    
    // 모바일용 매치 카드 렌더링
    const renderMobileMatch = (match: BracketMatch, roundIndex: number) => {
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
        
        return (
            <div
                key={match.id}
                className="mb-3"
                onClick={() => isEditable && onMatchClick?.(match)}
            >
                <div className={`
                    bg-white rounded-lg shadow-sm border-2 overflow-hidden
                    ${isEditable ? 'active:scale-98 cursor-pointer' : ''}
                    ${isFinal ? 'border-yellow-500' : isInProgress ? 'border-orange-500' : isCompleted ? 'border-gray-300' : 'border-gray-200'}
                `}>
                    {/* 매치 헤더 */}
                    {(isFinal || isInProgress) && (
                        <div className="bg-gray-50 px-3 py-1 border-b text-center">
                            {isFinal ? (
                                <span className="text-xs font-bold text-yellow-600">결승전</span>
                            ) : isInProgress ? (
                                <span className="text-xs font-bold text-orange-600 flex items-center justify-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-pulse"></span>
                                    진행중
                                </span>
                            ) : null}
                        </div>
                    )}
                    
                    {/* 팀 정보 */}
                    <div className="p-3">
                        <div className={`
                            flex items-center justify-between py-2
                            ${team1Won ? 'font-semibold text-green-600' : hasScore && !team1Won ? 'text-gray-400' : ''}
                        `}>
                            <span className="flex items-center gap-2">
                                {match.team1?.seed && (
                                    <span className="text-xs text-gray-500">#{match.team1.seed}</span>
                                )}
                                <span>{team1Name}</span>
                            </span>
                            {hasScore && (
                                <span className="text-lg font-bold">{team1Score}</span>
                            )}
                        </div>
                        
                        <div className="border-t my-1"></div>
                        
                        <div className={`
                            flex items-center justify-between py-2
                            ${team2Won ? 'font-semibold text-green-600' : hasScore && !team2Won ? 'text-gray-400' : ''}
                        `}>
                            <span className="flex items-center gap-2">
                                {match.team2?.seed && (
                                    <span className="text-xs text-gray-500">#{match.team2.seed}</span>
                                )}
                                <span>{team2Name}</span>
                            </span>
                            {hasScore && (
                                <span className="text-lg font-bold">{team2Score}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    // 데스크톱/태블릿용 매치 렌더링
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
                    width: typeof matchWidth === 'string' ? matchWidth : `${matchWidth}px`,
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
    
    // SVG 연결선 렌더링 (데스크톱/태블릿용)
    const renderConnectors = () => {
        if (isMobile) return null;
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
                    
                    const columnWidth = (typeof matchWidth === 'number' ? matchWidth : 200) + roundGap;
                    const startX = roundIndex * columnWidth + (typeof matchWidth === 'number' ? matchWidth : 200);
                    const midX = startX + roundGap / 2;
                    const endX = (roundIndex + 1) * columnWidth - roundGap / 2;
                    
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

    // 모바일 뷰 렌더링
    if (isMobile) {
        return (
            <div className="w-full bg-gray-50 rounded-lg">
                {/* 라운드 탭 네비게이션 */}
                <div className="bg-white border-b sticky top-0 z-10">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {bracket.rounds.map((round, index) => (
                            <button
                                key={round.round}
                                onClick={() => setActiveRound(index)}
                                className={`
                                    px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                                    ${activeRound === index 
                                        ? 'border-primary-600 text-primary-600 bg-primary-50' 
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }
                                `}
                            >
                                {getRoundName(index, bracket.rounds.length)}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* 활성 라운드 매치들 */}
                <div className="p-4">
                    {bracket.rounds[activeRound]?.matches.map((match) => 
                        renderMobileMatch(match, activeRound)
                    )}
                </div>
                
                {/* 라운드 네비게이션 버튼 */}
                <div className="flex justify-between items-center px-4 pb-4">
                    <button
                        onClick={() => setActiveRound(Math.max(0, activeRound - 1))}
                        disabled={activeRound === 0}
                        className={`
                            px-3 py-2 rounded-lg text-sm font-medium transition-colors
                            ${activeRound === 0 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }
                        `}
                    >
                        이전 라운드
                    </button>
                    
                    <span className="text-sm text-gray-600">
                        {activeRound + 1} / {bracket.rounds.length}
                    </span>
                    
                    <button
                        onClick={() => setActiveRound(Math.min(bracket.rounds.length - 1, activeRound + 1))}
                        disabled={activeRound === bracket.rounds.length - 1}
                        className={`
                            px-3 py-2 rounded-lg text-sm font-medium transition-colors
                            ${activeRound === bracket.rounds.length - 1 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }
                        `}
                    >
                        다음 라운드
                    </button>
                </div>
            </div>
        );
    }
    
    // 데스크톱/태블릿 뷰 렌더링
    const columnWidth = (typeof matchWidth === 'number' ? matchWidth : 200) + roundGap;
    const bracketWidth = bracket.rounds.length * columnWidth;
    
    return (
        <div className="w-full bg-gray-50 rounded-lg p-4 md:p-8">
            <div 
                ref={scrollContainerRef}
                className="overflow-x-auto"
                style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#9ca3af #f3f4f6'
                }}
            >
                <div className="relative" style={{ 
                    width: `${bracketWidth}px`,
                    height: typeof totalHeight === 'string' ? totalHeight : `${totalHeight}px`,
                    minHeight: '400px'
                }}>
                    {/* SVG 연결선 */}
                    <svg
                        className="absolute inset-0"
                        style={{
                            width: `${bracketWidth}px`,
                            height: typeof totalHeight === 'string' ? 'auto' : `${totalHeight}px`,
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
                                left: `${roundIndex * columnWidth}px`,
                                width: typeof matchWidth === 'string' ? matchWidth : `${matchWidth}px`,
                                height: typeof totalHeight === 'string' ? totalHeight : `${totalHeight}px`,
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
            
            {/* 태블릿용 스크롤 힌트 */}
            {isTablet && bracketWidth > 768 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                    ← 좌우로 스크롤하여 전체 브래킷을 확인하세요 →
                </div>
            )}
        </div>
    );
};

export default TournamentBracket;