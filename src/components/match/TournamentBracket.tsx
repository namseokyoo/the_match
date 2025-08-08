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
        
        return (
            <div
                key={match.id}
                className="bracket-match-wrapper"
                style={{
                    marginBottom: roundIndex === 0 ? '32px' : 
                                 roundIndex === 1 ? '80px' : 
                                 roundIndex === 2 ? '176px' : '368px'
                }}
            >
                <div
                    className={`bracket-match ${isEditable ? 'cursor-pointer' : ''} ${
                        isFinal ? 'final-match' : ''
                    }`}
                    onClick={() => isEditable && onMatchClick?.(match)}
                >
                    {/* 매치 번호 또는 라운드 정보 */}
                    {isFinal && (
                        <div className="match-header">
                            <div className="match-label">FINAL</div>
                        </div>
                    )}
                    
                    <div className={`match-container ${
                        isCompleted ? 'completed' :
                        isInProgress ? 'in-progress' :
                        'upcoming'
                    }`}>
                        {/* Team 1 */}
                        <div className={`team-row ${team1Won ? 'winner' : ''} ${
                            hasScore && !team1Won ? 'loser' : ''
                        }`}>
                            <div className="team-seed">{match.team1?.seed || ''}</div>
                            <div className="team-name">{team1Name}</div>
                            <div className="team-score">
                                {hasScore ? team1Score : '-'}
                            </div>
                        </div>
                        
                        {/* Team 2 */}
                        <div className={`team-row ${team2Won ? 'winner' : ''} ${
                            hasScore && !team2Won ? 'loser' : ''
                        }`}>
                            <div className="team-seed">{match.team2?.seed || ''}</div>
                            <div className="team-name">{team2Name}</div>
                            <div className="team-score">
                                {hasScore ? team2Score : '-'}
                            </div>
                        </div>
                    </div>
                    
                    {/* 경기 상태 표시 */}
                    {isInProgress && (
                        <div className="match-status in-progress">
                            <span className="status-dot"></span>
                            LIVE
                        </div>
                    )}
                </div>
                
                {/* 연결선 */}
                {roundIndex < totalRounds - 1 && (
                    <div className="connector-lines">
                        <div className="horizontal-line"></div>
                        {matchIndex % 2 === 0 && (
                            <div className="vertical-line-wrapper">
                                <div className="vertical-line"></div>
                                <div className="horizontal-line-next"></div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="tournament-bracket-container">
            <div className="tournament-bracket">
                <div className="bracket-wrapper">
                    {bracket.rounds.map((round, roundIndex) => (
                        <div key={round.round} className="bracket-column">
                            <div className="round-header">
                                <h3 className="round-title">
                                    {getRoundName(roundIndex, bracket.rounds.length)}
                                </h3>
                            </div>
                            <div className="matches-container">
                                {round.matches.map((match, matchIndex) => 
                                    renderMatch(match, roundIndex, matchIndex, bracket.rounds.length)
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <style jsx>{`
                .tournament-bracket-container {
                    width: 100%;
                    overflow-x: auto;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 16px;
                    padding: 2rem;
                    min-height: 600px;
                }
                
                .tournament-bracket {
                    min-width: max-content;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                }
                
                .bracket-wrapper {
                    display: flex;
                    gap: 60px;
                    align-items: flex-start;
                    padding: 20px;
                }
                
                .bracket-column {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    min-width: 240px;
                }
                
                .round-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .round-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1f2937;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    padding-bottom: 8px;
                    border-bottom: 3px solid #6366f1;
                    display: inline-block;
                }
                
                .matches-container {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-around;
                    flex: 1;
                }
                
                .bracket-match-wrapper {
                    position: relative;
                }
                
                .bracket-match {
                    position: relative;
                    transition: all 0.3s ease;
                }
                
                .bracket-match.cursor-pointer:hover {
                    transform: scale(1.05);
                }
                
                .match-container {
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    transition: all 0.3s ease;
                    width: 240px;
                }
                
                .match-container.completed {
                    background: #f9fafb;
                    border-color: #9ca3af;
                }
                
                .match-container.in-progress {
                    border-color: #fbbf24;
                    box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.2);
                    animation: pulse 2s infinite;
                }
                
                .match-container.upcoming:hover {
                    border-color: #6366f1;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
                }
                
                .final-match .match-container {
                    border-width: 3px;
                    border-color: #fbbf24;
                    background: linear-gradient(135deg, #fef3c7 0%, #fff 100%);
                    box-shadow: 0 8px 24px rgba(251, 191, 36, 0.3);
                }
                
                .match-header {
                    text-align: center;
                    margin-bottom: 8px;
                }
                
                .match-label {
                    display: inline-block;
                    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                    color: white;
                    padding: 4px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 1px;
                }
                
                .team-row {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    background: white;
                    transition: all 0.3s ease;
                    border-bottom: 1px solid #f3f4f6;
                }
                
                .team-row:last-child {
                    border-bottom: none;
                }
                
                .team-row.winner {
                    background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
                    color: white;
                    font-weight: 600;
                }
                
                .team-row.loser {
                    opacity: 0.6;
                    background: #f9fafb;
                }
                
                .team-seed {
                    width: 24px;
                    height: 24px;
                    background: #f3f4f6;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 600;
                    color: #6b7280;
                    margin-right: 12px;
                    flex-shrink: 0;
                }
                
                .team-row.winner .team-seed {
                    background: rgba(255, 255, 255, 0.3);
                    color: white;
                }
                
                .team-name {
                    flex: 1;
                    font-size: 14px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .team-score {
                    min-width: 32px;
                    text-align: center;
                    font-size: 16px;
                    font-weight: 700;
                    padding: 4px 8px;
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 4px;
                    margin-left: 8px;
                }
                
                .team-row.winner .team-score {
                    background: rgba(255, 255, 255, 0.3);
                    color: white;
                }
                
                .match-status {
                    position: absolute;
                    top: -10px;
                    right: 10px;
                    background: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                
                .match-status.in-progress {
                    background: #ef4444;
                    color: white;
                }
                
                .status-dot {
                    width: 6px;
                    height: 6px;
                    background: white;
                    border-radius: 50%;
                    animation: blink 1.5s infinite;
                }
                
                /* 연결선 스타일 */
                .connector-lines {
                    position: absolute;
                    top: 50%;
                    left: 100%;
                    pointer-events: none;
                }
                
                .horizontal-line {
                    position: absolute;
                    width: 30px;
                    height: 2px;
                    background: #d1d5db;
                    top: -1px;
                }
                
                .vertical-line-wrapper {
                    position: absolute;
                    left: 30px;
                }
                
                .vertical-line {
                    position: absolute;
                    width: 2px;
                    background: #d1d5db;
                    height: 64px;
                    top: -32px;
                }
                
                .horizontal-line-next {
                    position: absolute;
                    width: 30px;
                    height: 2px;
                    background: #d1d5db;
                    top: -1px;
                    left: 0;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                
                @media (max-width: 768px) {
                    .tournament-bracket-container {
                        padding: 1rem;
                    }
                    
                    .bracket-column {
                        min-width: 200px;
                    }
                    
                    .match-container {
                        width: 200px;
                    }
                    
                    .team-row {
                        padding: 8px;
                    }
                    
                    .team-name {
                        font-size: 13px;
                    }
                }
            `}</style>
        </div>
    );
};

export default TournamentBracket;