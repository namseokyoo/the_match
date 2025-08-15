'use client';

import React, { forwardRef } from 'react';
import { Trophy } from 'lucide-react';

interface BracketTeam {
  id: string;
  name: string;
  score?: number;
}

interface BracketMatch {
  id: string;
  round: number;
  team1?: BracketTeam;
  team2?: BracketTeam;
  winner?: BracketTeam;
}

interface ShareableBracketProps {
  title: string;
  matches: BracketMatch[];
  champion?: BracketTeam;
  className?: string;
}

const ShareableBracket = forwardRef<HTMLDivElement, ShareableBracketProps>(
  ({ title, matches, champion, className = '' }, ref) => {
    // 라운드별로 매치 그룹화
    const rounds = matches.reduce((acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    }, {} as Record<number, BracketMatch[]>);

    const maxRound = Math.max(...Object.keys(rounds).map(Number));

    return (
      <div
        ref={ref}
        className={`bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-2xl shadow-2xl text-white ${className}`}
        style={{ width: '1200px', minHeight: '800px' }}
      >
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold">토너먼트 브라켓</h1>
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>

        {/* 브라켓 */}
        <div className="flex justify-between items-center">
          {Object.entries(rounds).map(([round, roundMatches]) => (
            <div key={round} className="flex-1">
              <h3 className="text-center text-sm font-semibold text-purple-200 mb-4">
                {Number(round) === maxRound ? '결승' : 
                 Number(round) === maxRound - 1 ? '준결승' : 
                 `${round}라운드`}
              </h3>
              <div className="space-y-4">
                {roundMatches.map(match => (
                  <div key={match.id} className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <div className="space-y-2">
                      <div className={`flex items-center justify-between p-2 rounded ${
                        match.winner?.id === match.team1?.id ? 'bg-green-500/20' : 'bg-white/5'
                      }`}>
                        <span className="font-medium">
                          {match.team1?.name || 'TBD'}
                        </span>
                        {match.team1?.score !== undefined && (
                          <span className="font-bold">{match.team1.score}</span>
                        )}
                      </div>
                      <div className={`flex items-center justify-between p-2 rounded ${
                        match.winner?.id === match.team2?.id ? 'bg-green-500/20' : 'bg-white/5'
                      }`}>
                        <span className="font-medium">
                          {match.team2?.name || 'TBD'}
                        </span>
                        {match.team2?.score !== undefined && (
                          <span className="font-bold">{match.team2.score}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 우승팀 */}
          {champion && (
            <div className="flex-1 max-w-xs">
              <h3 className="text-center text-sm font-semibold text-yellow-400 mb-4">
                🏆 우승
              </h3>
              <div className="bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 backdrop-blur rounded-lg p-4 border-2 border-yellow-400">
                <div className="text-center">
                  <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                  <p className="text-xl font-bold">{champion.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="text-sm font-semibold">The Match</span>
          </div>
          <p className="text-xs text-purple-200">
            스포츠 경기 관리 플랫폼
          </p>
          <p className="text-xs text-purple-300 mt-1">
            the-match.vercel.app
          </p>
        </div>
      </div>
    );
  }
);

ShareableBracket.displayName = 'ShareableBracket';

export default ShareableBracket;