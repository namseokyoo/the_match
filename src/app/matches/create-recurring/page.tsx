'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, addDays, addWeeks, addMonths, isBefore, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Clock, Repeat, MapPin, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { showToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';

type RecurrenceType = 'daily' | 'weekly' | 'monthly';

interface RecurringMatchData {
  title: string;
  description: string;
  type: string;
  sport_type: string;
  venue: string;
  start_date: string;
  start_time: string;
  recurrence_type: RecurrenceType;
  recurrence_count: number;
  max_teams: number;
}

export default function CreateRecurringMatchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [previewDates, setPreviewDates] = useState<Date[]>([]);
  
  const [formData, setFormData] = useState<RecurringMatchData>({
    title: '',
    description: '',
    type: 'single_elimination',
    sport_type: 'football',
    venue: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '14:00',
    recurrence_type: 'weekly',
    recurrence_count: 4,
    max_teams: 8
  });

  // 날짜 미리보기 생성
  const generatePreviewDates = () => {
    const dates: Date[] = [];
    const startDate = new Date(`${formData.start_date}T${formData.start_time}`);
    
    for (let i = 0; i < formData.recurrence_count; i++) {
      let nextDate: Date;
      
      switch (formData.recurrence_type) {
        case 'daily':
          nextDate = addDays(startDate, i);
          break;
        case 'weekly':
          nextDate = addWeeks(startDate, i);
          break;
        case 'monthly':
          nextDate = addMonths(startDate, i);
          break;
        default:
          nextDate = startDate;
      }
      
      dates.push(nextDate);
    }
    
    setPreviewDates(dates);
  };

  // 폼 데이터 변경 시 미리보기 업데이트
  React.useEffect(() => {
    if (formData.start_date && formData.start_time && formData.recurrence_count > 0) {
      generatePreviewDates();
    }
  }, [formData.start_date, formData.start_time, formData.recurrence_type, formData.recurrence_count]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showToast('로그인이 필요합니다', 'error');
      router.push('/login');
      return;
    }

    if (!formData.title || !formData.venue) {
      showToast('필수 정보를 모두 입력해주세요', 'error');
      return;
    }

    setLoading(true);

    try {
      const matches = [];
      
      for (let i = 0; i < previewDates.length; i++) {
        const matchDate = previewDates[i];
        const matchTitle = `${formData.title} #${i + 1}`;
        
        matches.push({
          title: matchTitle,
          description: formData.description,
          type: formData.type,
          sport_type: formData.sport_type,
          start_date: format(matchDate, 'yyyy-MM-dd'),
          start_time: format(matchDate, 'HH:mm'),
          venue: formData.venue,
          max_teams: formData.max_teams,
          status: 'upcoming',
          creator_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // 모든 경기 생성
      const { data, error } = await supabase
        .from('tournaments')
        .insert(matches)
        .select();

      if (error) throw error;

      showToast(`${matches.length}개의 경기가 생성되었습니다!`, 'success');
      router.push('/matches');
    } catch (error) {
      console.error('Error creating recurring matches:', error);
      showToast('경기 생성 중 오류가 발생했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">반복 경기 생성</h1>
          <p className="mt-2 text-gray-600">
            정기적으로 열리는 경기를 한 번에 여러 개 생성할 수 있습니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  경기 제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: 주말 축구 리그"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  각 경기에 자동으로 번호가 추가됩니다
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  경기장 *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="경기장 위치"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  스포츠 종목
                </label>
                <select
                  value={formData.sport_type}
                  onChange={(e) => setFormData({ ...formData, sport_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="football">축구</option>
                  <option value="basketball">농구</option>
                  <option value="volleyball">배구</option>
                  <option value="baseball">야구</option>
                  <option value="badminton">배드민턴</option>
                  <option value="tennis">테니스</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  경기 방식
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="single_elimination">싱글 엘리미네이션</option>
                  <option value="double_elimination">더블 엘리미네이션</option>
                  <option value="round_robin">라운드 로빈</option>
                  <option value="swiss">스위스</option>
                  <option value="league">리그전</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최대 팀 수
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.max_teams}
                    onChange={(e) => setFormData({ ...formData, max_teams: parseInt(e.target.value) })}
                    min="2"
                    max="64"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="경기에 대한 설명을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 반복 설정 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              반복 설정
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  첫 경기 날짜
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시작 시간
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  반복 주기
                </label>
                <select
                  value={formData.recurrence_type}
                  onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value as RecurrenceType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">매일</option>
                  <option value="weekly">매주</option>
                  <option value="monthly">매월</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  반복 횟수
                </label>
                <input
                  type="number"
                  value={formData.recurrence_count}
                  onChange={(e) => setFormData({ ...formData, recurrence_count: parseInt(e.target.value) })}
                  min="2"
                  max="52"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  총 {formData.recurrence_count}개의 경기가 생성됩니다
                </p>
              </div>
            </div>
          </div>

          {/* 날짜 미리보기 */}
          {previewDates.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                생성될 경기 일정 미리보기
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {previewDates.map((date, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                  >
                    <div className="font-medium text-gray-900">
                      {formData.title} #{index + 1}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {format(date, 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(date, 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">확인사항</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>각 경기는 독립적으로 관리됩니다</li>
                      <li>생성 후 개별 경기 수정이 가능합니다</li>
                      <li>팀 참가 신청은 각 경기별로 받습니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/matches')}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !formData.title || !formData.venue}
            >
              {loading ? '생성 중...' : `${previewDates.length}개 경기 생성`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}