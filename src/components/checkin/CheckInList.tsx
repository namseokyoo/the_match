'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Users, User, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/ui/Toast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CheckIn {
  id: string;
  match_id: string;
  team_id?: string;
  player_id?: string;
  user_id: string;
  type: 'match' | 'team' | 'player';
  checked_in_at: string;
  status: 'checked_in' | 'checked_out' | 'absent';
  player?: {
    id: string;
    name: string;
    jersey_number?: number;
  };
  team?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

interface CheckInListProps {
  matchId: string;
  type?: 'all' | 'match' | 'team' | 'player';
  teamId?: string;
  isOwner?: boolean;
}

export default function CheckInList({
  matchId,
  type = 'all',
  teamId,
  isOwner = false
}: CheckInListProps) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'checked_in' | 'absent'>('all');

  useEffect(() => {
    fetchCheckIns();
  }, [matchId, type, teamId]);

  const fetchCheckIns = async () => {
    try {
      setLoading(true);

      // Mock 데이터 생성 (실제로는 DB에서 가져와야 함)
      const mockCheckIns: CheckIn[] = [
        {
          id: '1',
          match_id: matchId,
          team_id: 'team1',
          player_id: 'player1',
          user_id: 'user1',
          type: 'player',
          checked_in_at: new Date().toISOString(),
          status: 'checked_in',
          player: {
            id: 'player1',
            name: '김민수',
            jersey_number: 10
          },
          team: {
            id: 'team1',
            name: 'FC 서울'
          }
        },
        {
          id: '2',
          match_id: matchId,
          team_id: 'team1',
          player_id: 'player2',
          user_id: 'user2',
          type: 'player',
          checked_in_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'checked_in',
          player: {
            id: 'player2',
            name: '이영진',
            jersey_number: 7
          },
          team: {
            id: 'team1',
            name: 'FC 서울'
          }
        },
        {
          id: '3',
          match_id: matchId,
          team_id: 'team2',
          player_id: 'player3',
          user_id: 'user3',
          type: 'player',
          checked_in_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          status: 'checked_in',
          player: {
            id: 'player3',
            name: '박지성',
            jersey_number: 13
          },
          team: {
            id: 'team2',
            name: '수원 블루윙즈'
          }
        },
        {
          id: '4',
          match_id: matchId,
          team_id: 'team2',
          player_id: 'player4',
          user_id: 'user4',
          type: 'player',
          checked_in_at: '',
          status: 'absent',
          player: {
            id: 'player4',
            name: '최철수',
            jersey_number: 9
          },
          team: {
            id: 'team2',
            name: '수원 블루윙즈'
          }
        }
      ];

      // 필터링 적용
      let filtered = mockCheckIns;
      if (type !== 'all') {
        filtered = filtered.filter(c => c.type === type);
      }
      if (teamId) {
        filtered = filtered.filter(c => c.team_id === teamId);
      }

      setCheckIns(filtered);
    } catch (error) {
      console.error('체크인 목록 조회 실패:', error);
      showToast('체크인 목록을 불러올 수 없습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (checkInId: string, newStatus: 'checked_in' | 'absent') => {
    if (!isOwner) {
      showToast('권한이 없습니다', 'error');
      return;
    }

    try {
      // TODO: 실제 DB 업데이트
      setCheckIns(prev => prev.map(c => 
        c.id === checkInId 
          ? { 
              ...c, 
              status: newStatus,
              checked_in_at: newStatus === 'checked_in' ? new Date().toISOString() : ''
            }
          : c
      ));

      showToast('상태가 업데이트되었습니다', 'success');
    } catch (error) {
      console.error('상태 업데이트 실패:', error);
      showToast('상태 업데이트에 실패했습니다', 'error');
    }
  };

  // 필터링된 체크인 목록
  const filteredCheckIns = checkIns.filter(checkIn => {
    const matchesSearch = searchTerm === '' || 
      checkIn.player?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checkIn.team?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' ||
      (filterType === 'checked_in' && checkIn.status === 'checked_in') ||
      (filterType === 'absent' && checkIn.status === 'absent');

    return matchesSearch && matchesFilter;
  });

  // 통계 계산
  const stats = {
    total: checkIns.length,
    checkedIn: checkIns.filter(c => c.status === 'checked_in').length,
    absent: checkIns.filter(c => c.status === 'absent').length,
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* 헤더 및 통계 */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">체크인 현황</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">전체: {stats.total}명</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">출석: {stats.checkedIn}명</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-gray-600">결석: {stats.absent}명</span>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="이름 또는 팀명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="checked_in">출석</option>
            <option value="absent">결석</option>
          </select>
        </div>
      </div>

      {/* 체크인 목록 */}
      <div className="divide-y">
        {filteredCheckIns.length > 0 ? (
          filteredCheckIns.map(checkIn => (
            <div key={checkIn.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* 상태 아이콘 */}
                  <div className={`p-2 rounded-full ${
                    checkIn.status === 'checked_in' 
                      ? 'bg-green-100' 
                      : 'bg-red-100'
                  }`}>
                    {checkIn.status === 'checked_in' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>

                  {/* 정보 */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {checkIn.player?.name || '알 수 없음'}
                      </span>
                      {checkIn.player?.jersey_number && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          #{checkIn.player.jersey_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <span>{checkIn.team?.name}</span>
                      {checkIn.checked_in_at && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(checkIn.checked_in_at), 'HH:mm', { locale: ko })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 (주최자만) */}
                {isOwner && (
                  <div className="flex gap-2">
                    {checkIn.status === 'absent' ? (
                      <button
                        onClick={() => handleStatusChange(checkIn.id, 'checked_in')}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        출석 처리
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(checkIn.id, 'absent')}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        결석 처리
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || filterType !== 'all' 
              ? '검색 결과가 없습니다' 
              : '아직 체크인한 참가자가 없습니다'}
          </div>
        )}
      </div>
    </div>
  );
}