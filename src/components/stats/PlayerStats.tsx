'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Trophy, Target, TrendingUp, Award, Users, Activity } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

interface PlayerStat {
  id: string;
  player_id: string;
  team_id: string;
  match_id?: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  games_drawn: number;
  goals_scored: number;
  assists: number;
  points_scored: number;
  yellow_cards: number;
  red_cards: number;
  fouls_committed: number;
  minutes_played: number;
  mvp_awards: number;
  clean_sheets: number;
  win_rate: number;
  goals_per_game: number;
  season?: string;
  sport_type?: string;
  player?: {
    id: string;
    name: string;
    jersey_number?: number;
    position?: string;
    avatar_url?: string;
  };
  team?: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

interface PlayerStatsProps {
  playerId?: string;
  teamId?: string;
  matchId?: string;
  sportType?: string;
  season?: string;
  limit?: number;
}

export default function PlayerStats({
  playerId,
  teamId,
  matchId,
  sportType = 'football',
  season,
  limit = 10
}: PlayerStatsProps) {
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'goals' | 'assists' | 'win_rate' | 'games'>('goals');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchStats();
  }, [playerId, teamId, matchId, season, sortBy]);

  const fetchStats = async () => {
    try {
      let query = supabase
        .from('player_stats')
        .select(`
          *,
          player:players(id, name, jersey_number, position, avatar_url),
          team:teams(id, name, logo_url)
        `);

      // 필터 적용
      if (playerId) query = query.eq('player_id', playerId);
      if (teamId) query = query.eq('team_id', teamId);
      if (matchId) query = query.eq('match_id', matchId);
      if (season) query = query.eq('season', season);
      if (sportType) query = query.eq('sport_type', sportType);

      // 정렬
      switch (sortBy) {
        case 'goals':
          query = query.order('goals_scored', { ascending: false });
          break;
        case 'assists':
          query = query.order('assists', { ascending: false });
          break;
        case 'win_rate':
          query = query.order('win_rate', { ascending: false });
          break;
        case 'games':
          query = query.order('games_played', { ascending: false });
          break;
      }

      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      showToast('통계를 불러오는데 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">아직 통계 데이터가 없습니다</p>
      </div>
    );
  }

  const maxGoals = Math.max(...stats.map(s => s.goals_scored));
  const maxAssists = Math.max(...stats.map(s => s.assists));

  return (
    <div className="space-y-6">
      {/* 정렬 옵션 */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setSortBy('goals')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            sortBy === 'goals' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          득점순
        </button>
        <button
          onClick={() => setSortBy('assists')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            sortBy === 'assists' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          도움순
        </button>
        <button
          onClick={() => setSortBy('win_rate')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            sortBy === 'win_rate' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          승률순
        </button>
        <button
          onClick={() => setSortBy('games')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            sortBy === 'games' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          경기수순
        </button>
      </div>

      {/* 통계 카드 목록 */}
      <div className="space-y-4">
        {stats.map((stat, index) => (
          <div
            key={stat.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* 순위 */}
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index === 0 && <Trophy className="w-4 h-4 text-yellow-600 mx-auto mt-1" />}
                </div>

                {/* 선수 정보 */}
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {stat.player?.name}
                    {stat.player?.jersey_number && (
                      <span className="ml-2 text-sm text-gray-500">
                        #{stat.player.jersey_number}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {stat.team?.name && (
                      <>
                        <Users className="w-3 h-3" />
                        <span>{stat.team.name}</span>
                      </>
                    )}
                    {stat.player?.position && (
                      <span className="text-gray-400">• {stat.player.position}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* MVP 뱃지 */}
              {stat.mvp_awards > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  <Award className="w-4 h-4" />
                  <span className="text-sm font-medium">MVP x{stat.mvp_awards}</span>
                </div>
              )}
            </div>

            {/* 주요 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">경기</p>
                <p className="text-xl font-bold text-gray-900">{stat.games_played}</p>
                <p className="text-xs text-gray-600">
                  {stat.games_won}승 {stat.games_drawn}무 {stat.games_lost}패
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">득점</p>
                <p className="text-xl font-bold text-gray-900">{stat.goals_scored}</p>
                <p className="text-xs text-gray-600">
                  경기당 {stat.goals_per_game.toFixed(1)}골
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">도움</p>
                <p className="text-xl font-bold text-gray-900">{stat.assists}</p>
                <p className="text-xs text-gray-600">
                  공격포인트 {stat.goals_scored + stat.assists}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">승률</p>
                <p className="text-xl font-bold text-gray-900">{stat.win_rate.toFixed(1)}%</p>
                <p className="text-xs text-gray-600">
                  출전시간 {formatTime(stat.minutes_played)}
                </p>
              </div>
            </div>

            {/* 진행 바 */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>득점</span>
                  <span>{stat.goals_scored}골</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getStatColor(stat.goals_scored, maxGoals)}`}
                    style={{ width: `${maxGoals > 0 ? (stat.goals_scored / maxGoals) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>도움</span>
                  <span>{stat.assists}개</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getStatColor(stat.assists, maxAssists)}`}
                    style={{ width: `${maxAssists > 0 ? (stat.assists / maxAssists) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 경고 카드 */}
            {(stat.yellow_cards > 0 || stat.red_cards > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4">
                {stat.yellow_cards > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-5 bg-yellow-400 rounded-sm" />
                    <span className="text-sm text-gray-600">x{stat.yellow_cards}</span>
                  </div>
                )}
                {stat.red_cards > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-5 bg-red-500 rounded-sm" />
                    <span className="text-sm text-gray-600">x{stat.red_cards}</span>
                  </div>
                )}
                <span className="text-sm text-gray-500">
                  파울 {stat.fouls_committed}회
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}