'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui';
import PlayerStats from '@/components/stats/PlayerStats';
import { Trophy, Users, Target, Activity } from 'lucide-react';

function StatsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'players' | 'teams' | 'matches'>('players');
  const [sportType, setSportType] = useState('football');
  const [season, setSeason] = useState('2024');
  const [teamId, setTeamId] = useState<string | undefined>();
  const [matchId, setMatchId] = useState<string | undefined>();

  useEffect(() => {
    // URL 파라미터로부터 필터 설정
    const teamParam = searchParams.get('teamId');
    const matchParam = searchParams.get('matchId');
    
    if (teamParam) {
      setTeamId(teamParam);
      setActiveTab('players');
    }
    if (matchParam) {
      setMatchId(matchParam);
      setActiveTab('players');
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 통계 센터</h1>
        <p className="text-gray-600">선수, 팀, 경기별 상세 통계를 확인하세요</p>
      </div>

      {/* 필터 옵션 */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 탭 선택 */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('players')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'players'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-1" />
              선수 통계
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'teams'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              팀 통계
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'matches'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Target className="w-4 h-4 inline mr-1" />
              경기별 통계
            </button>
          </div>

          {/* 스포츠 종목 선택 */}
          <select
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="football">⚽ 축구</option>
            <option value="basketball">🏀 농구</option>
            <option value="baseball">⚾ 야구</option>
            <option value="volleyball">🏐 배구</option>
            <option value="badminton">🏸 배드민턴</option>
          </select>

          {/* 시즌 선택 */}
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2024">2024 시즌</option>
            <option value="2023">2023 시즌</option>
            <option value="2022">2022 시즌</option>
            <option value="all">전체 시즌</option>
          </select>
        </div>
      </Card>

      {/* 통계 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 선수</p>
              <p className="text-2xl font-bold text-gray-900">127</p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 경기</p>
              <p className="text-2xl font-bold text-gray-900">56</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 득점</p>
              <p className="text-2xl font-bold text-gray-900">342</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 득점</p>
              <p className="text-2xl font-bold text-gray-900">6.1</p>
            </div>
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* 통계 콘텐츠 */}
      <Card className="p-6">
        {activeTab === 'players' && (
          <PlayerStats
            teamId={teamId}
            matchId={matchId}
            sportType={sportType}
            season={season === 'all' ? undefined : season}
            limit={20}
          />
        )}
        
        {activeTab === 'teams' && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">팀 통계 기능은 준비 중입니다</p>
          </div>
        )}
        
        {activeTab === 'matches' && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">경기별 통계 기능은 준비 중입니다</p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <StatsContent />
    </Suspense>
  );
}