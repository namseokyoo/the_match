'use client';

import React, { forwardRef } from 'react';
import { Match, Team } from '@/types';
import { Trophy, Medal, Star, Users, Calendar, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface MatchResult {
  match: Match;
  winner?: Team;
  runnerUp?: Team;
  scores?: {
    [teamId: string]: number;
  };
  mvp?: {
    name: string;
    team: string;
    stats?: string;
  };
  topScorer?: {
    name: string;
    team: string;
    goals: number;
  };
}

interface ShareableResultCardProps {
  result: MatchResult;
  className?: string;
}

// forwardRef를 사용하여 html2canvas가 접근할 수 있도록 함
const ShareableResultCard = forwardRef<HTMLDivElement, ShareableResultCardProps>(
  ({ result, className = '' }, ref) => {
    const { match, winner, runnerUp, scores, mvp, topScorer } = result;

    return (
      <div
        ref={ref}
        className={`bg-gradient-to-br from-blue-600 to-purple-700 p-8 rounded-2xl shadow-2xl text-white ${className}`}
        style={{ width: '600px', minHeight: '800px' }}
      >
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold">경기 결과</h1>
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-semibold">{match.title}</h2>
          <p className="text-blue-200 mt-2">{match.type === 'single_elimination' ? '토너먼트' : match.type}</p>
        </div>

        {/* 우승/준우승 팀 */}
        {winner && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full mb-4">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-lg font-bold text-yellow-400">우승</span>
              </div>
              <h3 className="text-3xl font-bold mb-2">{winner.name}</h3>
              {scores && scores[winner.id] !== undefined && (
                <div className="text-4xl font-bold text-yellow-400">
                  {scores[winner.id]}점
                </div>
              )}
            </div>

            {runnerUp && (
              <div className="text-center pt-6 border-t border-white/20">
                <div className="inline-flex items-center gap-2 bg-gray-400/20 px-4 py-2 rounded-full mb-4">
                  <Medal className="w-5 h-5 text-gray-300" />
                  <span className="text-base font-semibold text-gray-300">준우승</span>
                </div>
                <h4 className="text-xl font-semibold mb-2">{runnerUp.name}</h4>
                {scores && scores[runnerUp.id] !== undefined && (
                  <div className="text-2xl font-semibold text-gray-300">
                    {scores[runnerUp.id]}점
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MVP & 득점왕 */}
        {(mvp || topScorer) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {mvp && (
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">MVP</span>
                </div>
                <p className="text-lg font-bold">{mvp.name}</p>
                <p className="text-sm text-blue-200">{mvp.team}</p>
                {mvp.stats && (
                  <p className="text-sm text-gray-300 mt-1">{mvp.stats}</p>
                )}
              </div>
            )}

            {topScorer && (
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Medal className="w-5 h-5 text-orange-400" />
                  <span className="font-semibold">득점왕</span>
                </div>
                <p className="text-lg font-bold">{topScorer.name}</p>
                <p className="text-sm text-blue-200">{topScorer.team}</p>
                <p className="text-sm text-orange-300 mt-1">{topScorer.goals}골</p>
              </div>
            )}
          </div>
        )}

        {/* 경기 정보 */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 space-y-3">
          {match.start_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-300" />
              <span>일시: {formatDate(match.start_date)}</span>
            </div>
          )}
          
          {match.venue_address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-blue-300" />
              <span>장소: {match.venue_address}</span>
            </div>
          )}

          {match.max_participants && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-blue-300" />
              <span>참가팀: {match.max_participants}팀</span>
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
          <p className="text-xs text-blue-200">
            스포츠 경기 관리 플랫폼
          </p>
          <p className="text-xs text-blue-300 mt-1">
            the-match.vercel.app
          </p>
        </div>
      </div>
    );
  }
);

ShareableResultCard.displayName = 'ShareableResultCard';

export default ShareableResultCard;