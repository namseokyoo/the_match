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
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50">
            {/* Onboarding Tour for new users */}
            <OnboardingTour autoStart={!!user} />

            {/* Hero Section with Live Now */}
            <section className="relative py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Live Now
                                </h2>
                            </div>
                        </div>
                        <p className="text-base text-gray-600 font-medium">
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
            <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="mx-auto max-w-7xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                🏆 참가 신청 가능한 경기
                            </h2>
                            <p className="text-sm text-gray-500">지금 바로 참가할 수 있는 경기들</p>
                        </div>
                        <Link 
                            href="/matches?status=registration" 
                            className="group flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            모두 보기 
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
                        // DB의 status가 registration인 경기만 표시 (calculateMatchStatus 대신 실제 status 사용)
                        return match.status === 'registration';
                    }).slice(0, 6).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {upcomingMatches.filter(match => {
                                // DB의 status가 registration인 경기만 표시
                                return match.status === 'registration';
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
                                        <div className="group bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-gray-900 text-lg line-clamp-1 flex-1 group-hover:text-blue-600 transition-colors">
                                                    {match.title}
                                                </h3>
                                                <span className={`px-2.5 py-1 text-xs rounded-full font-semibold ${statusColor} ml-2 shadow-sm`}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="w-4 h-4 text-blue-400" />
                                                    <span className="text-sm font-medium">{formatDate(match.start_date || '')}</span>
                                                </div>
                                                {match.registration_deadline && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-orange-400 animate-pulse" />
                                                        <span className="text-xs font-medium text-orange-600">
                                                            마감 {formatDate(match.registration_deadline)}
                                                        </span>
                                                    </div>
                                                )}
                                                {match.max_participants && (
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-green-400" />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs text-gray-600">
                                                                    {(match as any).current_participants || 0}/{match.max_participants} 팀
                                                                </span>
                                                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                                                                        style={{width: `${((match as any).current_participants || 0) / match.max_participants * 100}%`}}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-50">
                                                <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                                                    참가 신청하기 →
                                                </span>
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
            <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-green-50/30">
                <div className="mx-auto max-w-7xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                👥 팀원 모집
                            </h2>
                            <p className="text-sm text-gray-500">함께할 팀원을 찾고 있어요</p>
                        </div>
                        <Link 
                            href="/teams" 
                            className="group flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
                        >
                            모두 보기 
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
                                    <div className="group bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-green-200 hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-gray-900 text-lg line-clamp-1 flex-1 group-hover:text-green-600 transition-colors">
                                                {team.name}
                                            </h3>
                                            <span className="px-2.5 py-1 text-xs rounded-full font-semibold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 ml-2 shadow-sm">
                                                모집중
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                                            {team.description || '팀 설명이 없습니다'}
                                        </p>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <UserPlus className="w-4 h-4 text-green-500" />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        팀원 모집
                                                    </span>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {(team as any).current_members || 0} / {(team as any).recruitment_count || '?'} 명
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-300"
                                                    style={{width: `${((team as any).current_members || 0) / ((team as any).recruitment_count || 1) * 100}%`}}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-50">
                                            <span className="text-xs font-semibold text-green-600 group-hover:text-green-700">
                                                팀 참가하기 →
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl">
                            <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-700 mb-2">팀원을 모집 중인 팀이 없습니다</h3>
                            <p className="text-gray-600 mb-6">새로운 팀을 만들어 팀원을 모집해보세요!</p>
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
            <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 text-white mt-auto">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* Brand Section */}
                        <div className="flex flex-col items-center md:items-start">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-600 rounded-xl">
                                    <Trophy className="h-8 w-8 text-white" />
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                    The Match
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 text-center md:text-left max-w-xs">
                                스포츠 경기와 팀 매칭을 위한 완벽한 플랫폼
                            </p>
                        </div>
                        
                        {/* Quick Links */}
                        <div className="flex flex-col items-center md:items-start">
                            <h3 className="font-semibold text-gray-300 mb-4">빠른 링크</h3>
                            <div className="flex flex-col gap-2">
                                <Link href="/matches" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    경기 목록
                                </Link>
                                <Link href="/teams" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    팀 찾기
                                </Link>
                                <Link href="/community" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    커뮤니티
                                </Link>
                            </div>
                        </div>
                        
                        {/* Contact & Social */}
                        <div className="flex flex-col items-center md:items-start">
                            <h3 className="font-semibold text-gray-300 mb-4">문의하기</h3>
                            <div className="flex flex-col gap-2">
                                <a href="mailto:support@thematch.com" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    support@thematch.com
                                </a>
                                <p className="text-sm text-gray-400">
                                    평일 09:00 - 18:00
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-gray-700">
                        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                            <div className="text-sm text-gray-400">
                                © 2024 The Match. All rights reserved.
                            </div>
                            <div className="flex gap-6 text-sm text-gray-400">
                                <Link href="/privacy" className="hover:text-white transition-colors">
                                    개인정보처리방침
                                </Link>
                                <Link href="/terms" className="hover:text-white transition-colors">
                                    이용약관
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}