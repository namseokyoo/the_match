'use client';

import React, { useState, useEffect } from 'react';
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon, 
    Trophy,
    Users,
    Clock,
    MapPin,
    Filter,
    Grid3X3,
    List
} from 'lucide-react';
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO,
    startOfDay,
    endOfDay
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { Match, MatchStatus, MatchType } from '@/types';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: MatchType;
    status: MatchStatus;
    location?: string;
    maxParticipants?: number;
    currentParticipants?: number;
}

type ViewMode = 'month' | 'week' | 'list';

export const MatchCalendar: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<MatchStatus | 'all'>('all');
    const [selectedType, setSelectedType] = useState<MatchType | 'all'>('all');

    // 경기 데이터 가져오기
    useEffect(() => {
        fetchMatches();
    }, [currentDate, viewMode]);

    const fetchMatches = async () => {
        try {
            setLoading(true);
            
            let startDate: Date;
            let endDate: Date;

            if (viewMode === 'month') {
                startDate = startOfMonth(currentDate);
                endDate = endOfMonth(currentDate);
            } else if (viewMode === 'week') {
                startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
                endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
            } else {
                // List view - 현재 월의 모든 경기
                startDate = startOfMonth(currentDate);
                endDate = endOfMonth(currentDate);
            }

            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .or(`start_date.gte.${startDate.toISOString()},end_date.lte.${endDate.toISOString()}`)
                .order('start_date', { ascending: true });

            if (error) throw error;

            const calendarEvents: CalendarEvent[] = (data || []).map(match => ({
                id: match.id,
                title: match.title,
                date: parseISO(match.start_date || new Date().toISOString()),
                type: match.type,
                status: match.status,
                location: match.location,
                maxParticipants: match.max_participants,
                currentParticipants: match.current_participants || 0
            }));

            setEvents(calendarEvents);
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    };

    // 필터링된 이벤트
    const filteredEvents = events.filter(event => {
        if (selectedStatus !== 'all' && event.status !== selectedStatus) return false;
        if (selectedType !== 'all' && event.type !== selectedType) return false;
        return true;
    });

    // 날짜별 이벤트 그룹화
    const getEventsForDate = (date: Date) => {
        return filteredEvents.filter(event => 
            isSameDay(event.date, date)
        );
    };

    // 네비게이션 핸들러
    const navigatePrevious = () => {
        if (viewMode === 'month') {
            setCurrentDate(subMonths(currentDate, 1));
        } else {
            setCurrentDate(addDays(currentDate, -7));
        }
    };

    const navigateNext = () => {
        if (viewMode === 'month') {
            setCurrentDate(addMonths(currentDate, 1));
        } else {
            setCurrentDate(addDays(currentDate, 7));
        }
    };

    const navigateToday = () => {
        setCurrentDate(new Date());
    };

    // 상태 색상
    const getStatusColor = (status: MatchStatus) => {
        switch (status) {
            case MatchStatus.REGISTRATION:
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case MatchStatus.IN_PROGRESS:
                return 'bg-green-100 text-green-800 border-green-200';
            case MatchStatus.COMPLETED:
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case MatchStatus.CANCELLED:
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // 타입 레이블
    const getTypeLabel = (type: MatchType) => {
        switch (type) {
            case MatchType.SINGLE_ELIMINATION:
                return '토너먼트';
            case MatchType.DOUBLE_ELIMINATION:
                return '더블 엘리미네이션';
            case MatchType.ROUND_ROBIN:
                return '리그전';
            case MatchType.SWISS:
                return '스위스';
            case MatchType.LEAGUE:
                return '리그';
            default:
                return type;
        }
    };

    // 상태 레이블
    const getStatusLabel = (status: MatchStatus) => {
        switch (status) {
            case MatchStatus.REGISTRATION:
                return '모집중';
            case MatchStatus.IN_PROGRESS:
                return '진행중';
            case MatchStatus.COMPLETED:
                return '완료';
            case MatchStatus.CANCELLED:
                return '취소됨';
            default:
                return status;
        }
    };

    // 월 뷰 렌더링
    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

        const days = [];
        let day = startDate;

        while (day <= endDate) {
            days.push(day);
            day = addDays(day, 1);
        }

        return (
            <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* 요일 헤더 */}
                {['일', '월', '화', '수', '목', '금', '토'].map(dayName => (
                    <div key={dayName} className="bg-gray-50 p-2 text-center text-sm font-semibold text-gray-900">
                        {dayName}
                    </div>
                ))}

                {/* 날짜 셀 */}
                {days.map((day, index) => {
                    const dayEvents = getEventsForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={index}
                            className={`
                                min-h-[100px] bg-white p-2
                                ${!isCurrentMonth ? 'bg-gray-50' : ''}
                                ${isCurrentDay ? 'bg-blue-50' : ''}
                            `}
                        >
                            <div className={`
                                text-sm font-medium mb-1
                                ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                                ${isCurrentDay ? 'text-blue-600 font-bold' : ''}
                            `}>
                                {format(day, 'd')}
                            </div>

                            {/* 이벤트 목록 */}
                            <div className="space-y-1">
                                {dayEvents.slice(0, 3).map(event => (
                                    <Link
                                        key={event.id}
                                        href={`/matches/${event.id}`}
                                        className={`
                                            block px-1 py-0.5 text-xs rounded truncate
                                            hover:opacity-80 transition-opacity
                                            ${getStatusColor(event.status)}
                                        `}
                                    >
                                        {event.title}
                                    </Link>
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-xs text-gray-500 pl-1">
                                        +{dayEvents.length - 3}개 더보기
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // 주 뷰 렌더링
    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

        return (
            <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                    <div className="grid grid-cols-8 gap-px bg-gray-200">
                        {/* 시간 헤더 */}
                        <div className="bg-gray-50 p-2"></div>
                        {days.map(day => (
                            <div
                                key={day.toISOString()}
                                className={`
                                    bg-gray-50 p-2 text-center
                                    ${isToday(day) ? 'bg-blue-100' : ''}
                                `}
                            >
                                <div className="text-sm font-semibold">
                                    {format(day, 'EEE', { locale: ko })}
                                </div>
                                <div className={`text-lg ${isToday(day) ? 'font-bold text-blue-600' : ''}`}>
                                    {format(day, 'd')}
                                </div>
                            </div>
                        ))}

                        {/* 시간별 그리드 */}
                        {Array.from({ length: 24 }, (_, hour) => (
                            <React.Fragment key={hour}>
                                <div className="bg-white p-2 text-xs text-gray-500 text-right">
                                    {hour}:00
                                </div>
                                {days.map(day => {
                                    const dayEvents = getEventsForDate(day);
                                    return (
                                        <div
                                            key={`${day.toISOString()}-${hour}`}
                                            className="bg-white p-1 min-h-[40px] border-r border-gray-100"
                                        >
                                            {dayEvents.map(event => (
                                                <Link
                                                    key={event.id}
                                                    href={`/matches/${event.id}`}
                                                    className={`
                                                        block p-1 text-xs rounded mb-1
                                                        hover:opacity-80 transition-opacity
                                                        ${getStatusColor(event.status)}
                                                    `}
                                                >
                                                    <div className="font-medium truncate">
                                                        {event.title}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // 리스트 뷰 렌더링
    const renderListView = () => {
        const sortedEvents = [...filteredEvents].sort((a, b) => 
            a.date.getTime() - b.date.getTime()
        );

        const groupedEvents = sortedEvents.reduce((groups, event) => {
            const dateKey = format(event.date, 'yyyy-MM-dd');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(event);
            return groups;
        }, {} as Record<string, CalendarEvent[]>);

        return (
            <div className="space-y-4">
                {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => (
                    <div key={dateKey}>
                        <div className="sticky top-0 bg-gray-50 px-4 py-2 font-semibold text-gray-900 border-b">
                            {format(parseISO(dateKey), 'M월 d일 EEEE', { locale: ko })}
                        </div>
                        <div className="space-y-2 p-4">
                            {dateEvents.map(event => (
                                <Link
                                    key={event.id}
                                    href={`/matches/${event.id}`}
                                    className="block bg-white rounded-lg border hover:shadow-md transition-shadow p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-gray-900">
                                                    {event.title}
                                                </h3>
                                                <span className={`
                                                    px-2 py-0.5 text-xs rounded-full
                                                    ${getStatusColor(event.status)}
                                                `}>
                                                    {getStatusLabel(event.status)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Trophy className="w-4 h-4" />
                                                    <span>{getTypeLabel(event.type)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{format(event.date, 'HH:mm')}</span>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{event.location}</span>
                                                    </div>
                                                )}
                                                {event.maxParticipants && (
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        <span>{event.currentParticipants}/{event.maxParticipants}팀</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

                {Object.keys(groupedEvents).length === 0 && (
                    <div className="text-center py-12">
                        <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">이 기간에 예정된 경기가 없습니다.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow">
            {/* 헤더 */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">경기 일정</h2>
                    
                    {/* 뷰 모드 선택 */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`
                                px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                                ${viewMode === 'month' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                            `}
                        >
                            <Grid3X3 className="w-4 h-4 inline mr-1" />
                            월
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`
                                px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                                ${viewMode === 'week' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                            `}
                        >
                            <CalendarIcon className="w-4 h-4 inline mr-1" />
                            주
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`
                                px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                                ${viewMode === 'list' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                            `}
                        >
                            <List className="w-4 h-4 inline mr-1" />
                            목록
                        </button>
                    </div>
                </div>

                {/* 네비게이션 및 필터 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={navigatePrevious}
                            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={navigateToday}
                            className="px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            오늘
                        </button>
                        <button
                            onClick={navigateNext}
                            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-semibold text-gray-900 ml-4">
                            {viewMode === 'week'
                                ? `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'M월 d일')} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'M월 d일')}`
                                : format(currentDate, 'yyyy년 M월')
                            }
                        </h3>
                    </div>

                    {/* 필터 */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as MatchStatus | 'all')}
                            className="text-sm border-gray-300 rounded-md"
                        >
                            <option value="all">모든 상태</option>
                            <option value={MatchStatus.REGISTRATION}>모집중</option>
                            <option value={MatchStatus.IN_PROGRESS}>진행중</option>
                            <option value={MatchStatus.COMPLETED}>완료</option>
                            <option value={MatchStatus.CANCELLED}>취소됨</option>
                        </select>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as MatchType | 'all')}
                            className="text-sm border-gray-300 rounded-md"
                        >
                            <option value="all">모든 유형</option>
                            <option value={MatchType.SINGLE_ELIMINATION}>토너먼트</option>
                            <option value={MatchType.DOUBLE_ELIMINATION}>더블 엘리미네이션</option>
                            <option value={MatchType.ROUND_ROBIN}>리그전</option>
                            <option value={MatchType.SWISS}>스위스</option>
                            <option value={MatchType.LEAGUE}>리그</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 캘린더 콘텐츠 */}
            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {viewMode === 'month' && renderMonthView()}
                        {viewMode === 'week' && renderWeekView()}
                        {viewMode === 'list' && renderListView()}
                    </>
                )}
            </div>
        </div>
    );
};