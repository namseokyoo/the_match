'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Match } from '@/types';
import { formatDate } from '@/lib/utils';
import { calculateMatchStatus, getMatchStatusLabel, getMatchStatusColor } from '@/lib/match-utils';

interface LiveMatchCardProps {
    match: Match;
}

export default function LiveMatchCard({ match }: LiveMatchCardProps) {
    const calculatedStatus = calculateMatchStatus(
        match.registration_start_date,
        match.registration_deadline,
        match.start_date,
        match.end_date,
        match.status
    );
    const statusLabel = getMatchStatusLabel(calculatedStatus);
    const statusColor = getMatchStatusColor(calculatedStatus);
    
    // 경기 타입 한글 변환
    const getTypeLabel = (type: string) => {
        const typeMap: { [key: string]: string } = {
            'single_elimination': '토너먼트',
            'double_elimination': '더블 엘리미네이션',
            'round_robin': '리그전',
            'swiss': '스위스',
            'league': '리그'
        };
        return typeMap[type] || type;
    };

    // D-Day 계산
    const getDDay = () => {
        if (!match.start_date) return null;
        const today = new Date();
        const startDate = new Date(match.start_date);
        const diffTime = startDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return '오늘';
        if (diffDays === 1) return '내일';
        if (diffDays > 0) return `D-${diffDays}`;
        return '진행중';
    };

    const dDay = getDDay();
    const isLive = calculatedStatus === 'in_progress';

    return (
        <Link href={`/matches/${match.id}`}>
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white hover:shadow-2xl transition-all duration-300 cursor-pointer h-full">
                {/* Live 인디케이터 */}
                {isLive && (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span className="text-sm font-bold">LIVE</span>
                    </div>
                )}

                {/* D-Day 표시 */}
                {!isLive && dDay && (
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-sm font-bold">{dDay}</span>
                    </div>
                )}

                {/* 경기 정보 */}
                <div className="space-y-4">
                    {/* 제목 */}
                    <div>
                        <h3 className="text-xl font-bold mb-1 line-clamp-1">
                            {match.title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded-md font-medium ${statusColor} bg-white/90`}>
                                {statusLabel}
                            </span>
                            <span className="text-sm opacity-90">
                                {getTypeLabel(match.type)}
                            </span>
                        </div>
                    </div>

                    {/* 상세 정보 */}
                    <div className="space-y-2 text-sm">
                        {match.start_date && (
                            <div className="flex items-center gap-2 opacity-90">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(match.start_date)}</span>
                                {match.end_date && match.start_date !== match.end_date && (
                                    <span>~ {formatDate(match.end_date)}</span>
                                )}
                            </div>
                        )}

                        {match.venue && (
                            <div className="flex items-center gap-2 opacity-90">
                                <MapPin className="w-4 h-4" />
                                <span className="line-clamp-1">{match.venue}</span>
                            </div>
                        )}

                        {match.max_participants && (
                            <div className="flex items-center gap-2 opacity-90">
                                <Users className="w-4 h-4" />
                                <span>
                                    {(match as any).current_participants || 0} / {match.max_participants} 팀
                                </span>
                            </div>
                        )}

                        {match.registration_deadline && !isLive && (
                            <div className="flex items-center gap-2 text-yellow-200">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">
                                    신청 마감: {formatDate(match.registration_deadline)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 참가 버튼 또는 상태 */}
                    {!isLive && calculatedStatus === 'registration' && (
                        <div className="pt-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center font-medium">
                                참가 신청하기
                            </div>
                        </div>
                    )}

                    {isLive && (
                        <div className="pt-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center font-medium">
                                경기 상세 보기
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}