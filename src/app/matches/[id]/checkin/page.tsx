'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card } from '@/components/ui';
import { QRCodeGenerator, QRCodeScanner, CheckInList } from '@/components/checkin';
import { showToast } from '@/components/ui/Toast';
import { QrCode, Scan, Users } from 'lucide-react';
import { Match } from '@/types';

export default function MatchCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const { user } = useAuth();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'list' | 'scan'>('qr');
  const [showScanner, setShowScanner] = useState(false);

  const fetchMatchData = useCallback(async () => {
    try {
      setLoading(true);

      // 경기 정보 조회
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) {
        console.error('Match fetch error:', matchError);
        showToast('경기 정보를 불러올 수 없습니다', 'error');
        return;
      }

      setMatch(matchData);

      // 소유자 확인
      if (user && matchData.creator_id === user.id) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error('Data fetch error:', error);
      showToast('데이터를 불러오는데 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  }, [matchId, user]);

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  const handleScan = async (data: any) => {
    try {
      // QR 코드 데이터 처리
      console.log('Scanned data:', data);

      // TODO: 실제 체크인 처리
      // const { error } = await supabase
      //   .from('checkins')
      //   .insert({
      //     match_id: data.matchId,
      //     team_id: data.teamId,
      //     player_id: data.playerId,
      //     user_id: user?.id,
      //     type: data.type,
      //     checked_in_at: new Date().toISOString(),
      //     status: 'checked_in'
      //   });

      showToast('체크인이 완료되었습니다!', 'success');
      setShowScanner(false);
      
      // 체크인 목록 새로고침
      if (activeTab === 'list') {
        fetchMatchData();
      }
    } catch (error) {
      console.error('체크인 처리 실패:', error);
      showToast('체크인 처리에 실패했습니다', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-match-blue"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">경기를 찾을 수 없습니다</p>
          <Button
            onClick={() => router.push('/matches')}
            variant="primary"
            className="mt-4"
          >
            경기 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/matches/${matchId}`)}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            경기 상세로 돌아가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{match.title} - 체크인</h1>
          <p className="mt-2 text-gray-600">
            QR 코드를 통해 참가자 출석을 관리할 수 있습니다.
          </p>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'qr'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR 코드 생성</span>
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'scan'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>QR 스캔</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'list'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>출석 현황</span>
            </button>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'qr' && (
          <div className="space-y-6">
            {/* 경기 전체 체크인 QR */}
            <QRCodeGenerator
              matchId={matchId}
              type="match"
              title="경기 체크인 QR 코드"
              subtitle="이 QR 코드를 스캔하면 경기에 체크인됩니다"
            />

            {/* 안내 사항 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 사용 안내</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <span className="font-medium text-gray-900 mr-2">1.</span>
                  <p>생성된 QR 코드를 경기장 입구나 안내 데스크에 비치합니다.</p>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-gray-900 mr-2">2.</span>
                  <p>참가자들이 The Match 앱의 QR 스캔 기능으로 체크인합니다.</p>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-gray-900 mr-2">3.</span>
                  <p>출석 현황 탭에서 실시간으로 체크인 상태를 확인할 수 있습니다.</p>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-gray-900 mr-2">4.</span>
                  <p>QR 코드는 24시간 동안 유효하며, 필요시 새로고침할 수 있습니다.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scan className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">QR 코드 스캔</h3>
                <p className="text-gray-600 mb-6">
                  다른 경기나 팀의 QR 코드를 스캔하여 체크인할 수 있습니다
                </p>
                <Button
                  onClick={() => setShowScanner(true)}
                  variant="primary"
                  size="lg"
                >
                  스캐너 시작
                </Button>
              </div>
            </Card>

            {/* 최근 체크인 기록 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 체크인</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckInIcon className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">FC 서울 경기</p>
                      <p className="text-sm text-gray-600">오늘 14:30</p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    체크인 완료
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'list' && (
          <CheckInList
            matchId={matchId}
            isOwner={isOwner}
          />
        )}

        {/* QR 스캐너 모달 */}
        <QRCodeScanner
          isOpen={showScanner}
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      </div>
    </div>
  );
}

function CheckInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}