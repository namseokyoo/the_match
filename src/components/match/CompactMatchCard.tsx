import React from 'react';
import Link from 'next/link';
import { Match, MatchStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { calculateMatchStatus, getMatchStatusLabel } from '@/lib/match-utils';
import { Calendar, MapPin, Users, Trophy, ChevronRight } from 'lucide-react';

interface CompactMatchCardProps {
    match: Match;
    onView?: (matchId: string) => void;
}

// 경기 타입 아이콘
const getMatchTypeIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
        'single_elimination': '🏆',
        'double_elimination': '🎯',
        'round_robin': '🔄',
        'swiss': '🎲',
        'league': '📊',
    };
    return iconMap[type] || '🏆';
};

// D-Day 계산
const getDDay = (date: string | undefined): string => {
    if (!date) return '';
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays > 0) return `D-${diffDays}`;
    return '종료됨';
};

export const CompactMatchCard: React.FC<CompactMatchCardProps> = ({ match, onView }) => {
    const calculatedStatus = calculateMatchStatus(
        match.registration_start_date ?? null,
        match.registration_deadline ?? null,
        match.start_date ?? null,
        match.end_date ?? null,
        match.status
    );
    
    const statusLabel = getMatchStatusLabel(calculatedStatus);
    const dDay = getDDay(match.start_date);
    const typeIcon = getMatchTypeIcon(match.type);
    
    // 상태별 색상 (border-left)
    const getStatusColor = () => {
        switch(calculatedStatus) {
            case MatchStatus.REGISTRATION:
                return 'border-l-4 border-l-green-500';
            case MatchStatus.IN_PROGRESS:
                return 'border-l-4 border-l-blue-500';
            case MatchStatus.COMPLETED:
                return 'border-l-4 border-l-gray-400';
            case MatchStatus.CANCELLED:
                return 'border-l-4 border-l-red-500';
            default:
                return 'border-l-4 border-l-gray-300';
        }
    };
    
    // 참가 현황 계산
    const participantsCount = match.current_participants || 0;
    const maxParticipants = match.max_participants || 0;
    const participantPercentage = maxParticipants > 0 ? (participantsCount / maxParticipants) * 100 : 0;

    return (
        <div 
            className={`
                bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all cursor-pointer
                ${getStatusColor()}
            `}
            onClick={() => onView?.(match.id)}
            data-testid="compact-match-card"
        >
            <div className="flex justify-between items-center gap-4">
                {/* 왼쪽: 핵심 정보 */}
                <div className="flex-1 min-w-0">
                    {/* 제목과 상태 */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{typeIcon}</span>
                        <h3 className="font-semibold text-sm text-gray-900 truncate flex-1">
                            {match.title}
                        </h3>
                        {dDay && (
                            <span className={`
                                px-2 py-0.5 rounded-full text-xs font-bold
                                ${dDay === '오늘' ? 'bg-red-100 text-red-700' : 
                                  dDay === '내일' ? 'bg-orange-100 text-orange-700' :
                                  dDay.startsWith('D-') ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-600'}
                            `}>
                                {dDay}
                            </span>
                        )}
                    </div>
                    
                    {/* 정보 라인 */}
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                        {match.start_date && (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(match.start_date).split(' ')[0]}</span>
                            </div>
                        )}
                        {match.venue && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">{match.venue}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{participantsCount}/{maxParticipants || '∞'}</span>
                        </div>
                    </div>
                    
                    {/* 참가 진행률 바 (선택적) */}
                    {maxParticipants > 0 && (
                        <div className="mt-2 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                                className={`h-1.5 rounded-full transition-all ${
                                    participantPercentage >= 100 ? 'bg-red-500' :
                                    participantPercentage >= 80 ? 'bg-orange-500' :
                                    'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(participantPercentage, 100)}%` }}
                            />
                        </div>
                    )}
                </div>
                
                {/* 오른쪽: 액션 */}
                <div className="flex items-center flex-shrink-0">
                    {calculatedStatus === MatchStatus.REGISTRATION ? (
                        <button 
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                // 참가 로직 추가 예정
                            }}
                        >
                            참가
                        </button>
                    ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompactMatchCard;