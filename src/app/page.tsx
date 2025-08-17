'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Clock, ArrowRight, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingTour } from '@/components/onboarding';
import { Match, Team } from '@/types';
import { formatDate } from '@/lib/utils';
import { dashboardAPI } from '@/lib/api-client';
import { calculateMatchStatus, getMatchStatusLabel, getMatchStatusColor } from '@/lib/match-utils';
import Carousel from '@/components/ui/Carousel';
import LiveMatchCard from '@/components/home/LiveMatchCard';
import CommunitySection from '@/components/home/CommunitySection';

export default function Home() {
    const { user } = useAuth();
    const [recruitingTeams, setRecruitingTeams] = useState<Team[]>([]);
    const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [liveMatches, setLiveMatches] = useState<Match[]>([]);

    useEffect(() => {
        fetchDynamicContent();
    }, []);

    const fetchDynamicContent = async () => {
        try {
            setLoading(true);
            
            // 캐시 무효화 - 페이지 로드 시 항상 최신 데이터 가져오기
            if (typeof window !== 'undefined') {
                const apiClient = (await import('@/lib/api-client')).performanceUtils;
                apiClient.clearCache('/api/dashboard');
            }
            
            // 단일 API 호출로 모든 데이터 가져오기
            const dashboardData = await dashboardAPI.getHomeData().catch(err => {
                console.error('Dashboard API error:', err);
                return { 
                    success: false, 
                    data: {
                        activeMatches: [],
                        upcomingMatches: [],
                        recruitingTeams: [],
                        stats: { totalMatches: 0, totalTeams: 0, totalPlayers: 0 }
                    }
                };
            });

            if (dashboardData.success && dashboardData.data) {
                const { activeMatches, upcomingMatches, recruitingTeams } = dashboardData.data;
                setUpcomingMatches(upcomingMatches || []);
                setRecruitingTeams(recruitingTeams || []);

                // Live 경기 필터링 (진행중이거나 앞으로 7일 이내 시작할 경기)
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                
                const live = [...(activeMatches || []), ...(upcomingMatches || [])]
                    .filter(match => {
                        if (!match.start_date) return false;
                        
                        const status = calculateMatchStatus(
                            match.registration_start_date,
                            match.registration_deadline,
                            match.start_date,
                            match.end_date,
                            match.status
                        );
                        
                        const matchDate = new Date(match.start_date);
                        
                        // 진행중인 경기
                        const isInProgress = status === 'in_progress';
                        
                        // 오늘 경기
                        const isToday = match.start_date.startsWith(todayStr);
                        
                        // 7일 이내 시작할 경기
                        const isUpcomingSoon = matchDate > today && matchDate <= sevenDaysLater;
                        
                        return isInProgress || isToday || isUpcomingSoon;
                    })
                    .sort((a, b) => {
                        // 진행중 > 오늘 > 곧 시작 순으로 정렬
                        const statusA = calculateMatchStatus(
                            a.registration_start_date,
                            a.registration_deadline,
                            a.start_date,
                            a.end_date,
                            a.status
                        );
                        const statusB = calculateMatchStatus(
                            b.registration_start_date,
                            b.registration_deadline,
                            b.start_date,
                            b.end_date,
                            b.status
                        );
                        
                        if (statusA === 'in_progress') return -1;
                        if (statusB === 'in_progress') return 1;
                        
                        return new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime();
                    })
                    .slice(0, 5); // 최대 5개만
                
                setLiveMatches(live);
            }
        } catch (error) {
            console.error('Error fetching dynamic content:', error);
            setRecruitingTeams([]);
            setUpcomingMatches([]);
            setLiveMatches([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            {/* Onboarding Tour for new users */}
            <OnboardingTour autoStart={!!user} />

            {/* 1. Live Now - 캐러셀 슬라이더 */}
            <section className="py-6 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Live Now
                        </h2>
                        <p className="text-sm text-gray-600">
                            진행중이거나 곧 시작될 경기들
                        </p>
                    </div>

                    {loading ? (
                        <div className="bg-blue-600 rounded-2xl p-6 animate-pulse">
                            <div className="h-32 bg-blue-500 rounded"></div>
                        </div>
                    ) : liveMatches.length > 0 ? (
                        <Carousel
                            autoPlay={true}
                            autoPlayInterval={5000}
                            showIndicators={true}
                            showArrows={true}
                            className="rounded-2xl overflow-hidden"
                        >
                            {liveMatches.map(match => (
                                <LiveMatchCard key={match.id} match={match} />
                            ))}
                        </Carousel>
                    ) : (
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-12 text-center">
                            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-700 mb-2">예정된 경기가 없습니다</h3>
                            <p className="text-gray-600 mb-6">새로운 경기를 만들어보세요!</p>
                            {user ? (
                                <Link 
                                    href="/matches/create" 
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                                >
                                    경기 만들기
                                </Link>
                            ) : (
                                <Link 
                                    href="/signup" 
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                                >
                                    회원가입하고 시작하기
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* 2. 참가 신청 가능한 경기 */}
            <section className="py-6 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="mx-auto max-w-7xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            참가 신청 가능한 경기
                        </h2>
                        <Link 
                            href="/matches?status=registration" 
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
                        >
                            모두 보기 <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
                                    <div className="h-5 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            ))}
                        </div>
                    ) : upcomingMatches.filter(match => {
                        // registration 상태인 경기만 표시
                        const status = calculateMatchStatus(
                            match.registration_start_date,
                            match.registration_deadline,
                            match.start_date,
                            match.end_date,
                            match.status
                        );
                        return status === 'registration';
                    }).slice(0, 6).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {upcomingMatches.filter(match => {
                                const status = calculateMatchStatus(
                                    match.registration_start_date,
                                    match.registration_deadline,
                                    match.start_date,
                                    match.end_date,
                                    match.status
                                );
                                return status === 'registration';
                            }).slice(0, 6).map(match => {
                                const calculatedStatus = calculateMatchStatus(
                                    match.registration_start_date,
                                    match.registration_deadline,
                                    match.start_date,
                                    match.end_date,
                                    match.status
                                );
                                const statusLabel = getMatchStatusLabel(calculatedStatus);
                                const statusColor = getMatchStatusColor(calculatedStatus);

                                return (
                                    <Link key={match.id} href={`/matches/${match.id}`}>
                                        <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer h-full">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                                                    {match.title}
                                                </h3>
                                                <span className={`px-2 py-0.5 text-xs rounded-md font-medium ${statusColor} ml-2`}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span>{formatDate(match.start_date || '')}</span>
                                                </div>
                                                {match.registration_deadline && (
                                                    <div className="flex items-center gap-2 text-orange-600">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-xs">마감 {formatDate(match.registration_deadline)}</span>
                                                    </div>
                                                )}
                                                {match.max_participants && (
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-gray-400" />
                                                        <span className="text-xs">
                                                            {(match as any).current_participants || 0}/{match.max_participants} 팀
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">참가 신청 가능한 경기가 없습니다</p>
                            {user ? (
                                <Link 
                                    href="/matches/create" 
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    새 경기 만들기
                                </Link>
                            ) : (
                                <Link 
                                    href="/signup" 
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    회원가입하고 시작하기
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* 3. 팀원 모집 */}
            <section className="py-6 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            팀원 모집
                        </h2>
                        <Link 
                            href="/teams" 
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-sm"
                        >
                            모두 보기 <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
                                    <div className="h-5 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            ))}
                        </div>
                    ) : recruitingTeams.slice(0, 6).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recruitingTeams.slice(0, 6).map(team => (
                                <Link key={team.id} href={`/teams/${team.id}`}>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md hover:border-green-300 transition-all cursor-pointer h-full">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                                                {team.name}
                                            </h3>
                                            <span className="px-2 py-0.5 text-xs rounded-md font-medium bg-green-50 text-green-700 border border-green-200 ml-2">
                                                모집중
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                            {team.description || '팀 설명이 없습니다'}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <UserPlus className="w-4 h-4" />
                                            <span>
                                                {(team as any).current_members || 0} / {(team as any).recruitment_count || '?'} 명
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg">
                            <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">팀원을 모집 중인 팀이 없습니다</p>
                            {user ? (
                                <Link 
                                    href="/teams/create" 
                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    새 팀 만들기
                                </Link>
                            ) : (
                                <Link 
                                    href="/signup" 
                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    회원가입하고 시작하기
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* 4. 커뮤니티 섹션 */}
            <CommunitySection />

            {/* Footer */}
            <footer className="bg-gray-900 py-8 px-4 text-white mt-auto">
                <div className="mx-auto max-w-6xl">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-6 w-6" />
                            <span className="text-xl font-bold">The Match</span>
                        </div>
                        <div className="text-sm text-gray-400">
                            © 2024 The Match. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}