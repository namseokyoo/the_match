'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeScanner } from '@/components/checkin';
import { Button } from '@/components/ui';
import { Scan, History, CheckCircle, Calendar } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CheckInHistory {
  id: string;
  type: 'match' | 'team' | 'player';
  title: string;
  subtitle?: string;
  checkedInAt: string;
  matchId: string;
}

export default function CheckInPage() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [history, setHistory] = useState<CheckInHistory[]>([
    // Mock data - 실제로는 localStorage나 DB에서 가져와야 함
    {
      id: '1',
      type: 'match',
      title: '주말 축구 리그',
      subtitle: 'FC 서울 vs 수원 블루윙즈',
      checkedInAt: new Date().toISOString(),
      matchId: 'match1'
    },
    {
      id: '2',
      type: 'team',
      title: 'FC 서울',
      subtitle: '팀 체크인',
      checkedInAt: new Date(Date.now() - 86400000).toISOString(),
      matchId: 'match2'
    }
  ]);

  const handleScan = async (data: any) => {
    try {
      console.log('Scanned data:', data);

      // 체크인 처리
      const newCheckIn: CheckInHistory = {
        id: Date.now().toString(),
        type: data.type,
        title: data.title || '체크인 완료',
        subtitle: data.subtitle,
        checkedInAt: new Date().toISOString(),
        matchId: data.matchId
      };

      // 히스토리에 추가
      setHistory(prev => [newCheckIn, ...prev]);

      // localStorage에 저장
      const storedHistory = localStorage.getItem('checkin_history');
      const currentHistory = storedHistory ? JSON.parse(storedHistory) : [];
      localStorage.setItem('checkin_history', JSON.stringify([newCheckIn, ...currentHistory].slice(0, 10)));

      showToast('체크인이 완료되었습니다!', 'success');
      setShowScanner(false);

      // 해당 경기 페이지로 이동
      if (data.matchId) {
        setTimeout(() => {
          router.push(`/matches/${data.matchId}`);
        }, 1500);
      }
    } catch (error) {
      console.error('체크인 처리 실패:', error);
      showToast('체크인 처리에 실패했습니다', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">체크인</h1>
          <p className="text-gray-600">
            QR 코드를 스캔하여 경기나 팀에 체크인하세요
          </p>
        </div>

        {/* 메인 스캔 버튼 */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 mb-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scan className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              QR 코드 스캔
            </h2>
            <p className="text-gray-600 mb-6">
              경기장에 비치된 QR 코드를 스캔하세요
            </p>
            <Button
              onClick={() => setShowScanner(true)}
              variant="primary"
              size="lg"
              className="w-full"
            >
              <Scan className="w-5 h-5 mr-2" />
              스캐너 시작
            </Button>
          </div>
        </div>

        {/* 최근 체크인 기록 */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">최근 체크인</h3>
            <History className="w-5 h-5 text-gray-400" />
          </div>

          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => router.push(`/matches/${item.matchId}`)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      item.type === 'match' 
                        ? 'bg-blue-100' 
                        : item.type === 'team'
                        ? 'bg-green-100'
                        : 'bg-purple-100'
                    }`}>
                      {item.type === 'match' ? (
                        <Calendar className="w-5 h-5 text-blue-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-sm text-gray-600">{item.subtitle}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(item.checkedInAt), 'M월 d일 HH:mm', { locale: ko })}
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">아직 체크인 기록이 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">
                QR 코드를 스캔하여 첫 체크인을 해보세요
              </p>
            </div>
          )}
        </div>

        {/* 도움말 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 체크인 안내</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 경기장 입구에 비치된 QR 코드를 스캔하세요</li>
            <li>• 체크인 후 실시간으로 출석 현황이 업데이트됩니다</li>
            <li>• 체크인 기록은 자동으로 저장됩니다</li>
          </ul>
        </div>
      </div>

      {/* QR 스캐너 */}
      <QRCodeScanner
        isOpen={showScanner}
        onScan={handleScan}
        onClose={() => setShowScanner(false)}
      />
    </div>
  );
}