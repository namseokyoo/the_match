'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Clock, ArrowRight, UserPlus, Users, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingTour } from '@/components/onboarding';
import WelcomeGuide from '@/components/onboarding/WelcomeGuide';
import { Match, Team } from '@/types';
import { formatDate } from '@/lib/utils';
import { dashboardAPI } from '@/lib/api-client';
import { calculateMatchStatus, getMatchStatusLabel, getMatchStatusColor } from '@/lib/match-utils';
import Carousel from '@/components/ui/Carousel';
import LiveMatchCard from '@/components/home/LiveMatchCard';
import CommunitySection from '@/components/home/CommunitySection';
import { CompactMatchCard } from '@/components/match/CompactMatchCard';
import { CompactTeamCard } from '@/components/team/CompactTeamCard';

export default function Home() {
    const { user } = useAuth();
    const router = useRouter();
    const [recruitingTeams, setRecruitingTeams] = useState<Team[]>([]);
    const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [liveMatches, setLiveMatches] = useState<Match[]>([]);
    const [showGuideFromFooter, setShowGuideFromFooter] = useState(false);

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
                const data = dashboardData.data as any;
                const { activeMatches, upcomingMatches, recruitingTeams } = data;
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
            
            {/* Welcome Guide for first-time visitors */}
            <WelcomeGuide />
            
            {/* Welcome Guide from footer */}
            {showGuideFromFooter && (
                <WelcomeGuide 
                    isFooterVersion={true} 
                    onClose={() => setShowGuideFromFooter(false)} 
                />
            )}

            {/* Hero Section with Live Now */}
            <section className="relative py-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="relative">
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <h2 className="text-xl font-bold text-gray-900 lg:text-2xl">
                                    Live Now
                                </h2>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">
                            진행중이거나 곧 시작될 경기들
                        </p>
                    </div>

                    {loading ? (
                        <div className="bg-gray-100 rounded-lg p-4 animate-pulse">
                            <div className="h-24 bg-gray-200 rounded"></div>
                        </div>
                    ) : liveMatches.length > 0 ? (
                        <Carousel
                            autoPlay={true}
                            autoPlayInterval={5000}
                            showIndicators={true}
                            showArrows={true}
                            className="rounded-lg overflow-hidden"
                        >
                            {liveMatches.map(match => (
                                <LiveMatchCard key={match.id} match={match} />
                            ))}
                        </Carousel>
                    ) : (
                        <div className="bg-gray-100 rounded-lg p-8 text-center">
                            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-gray-700 mb-2">예정된 경기가 없습니다</h3>
                            <p className="text-sm text-gray-500 mb-4">새로운 경기를 만들어보세요!</p>
                            {user ? (
                                <Link 
                                    href="/matches/create" 
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    경기 만들기
                                </Link>
                            ) : (
                                <Link 
                                    href="/signup" 
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 lg:text-2xl">
                                참가 신청 가능한 경기
                            </h2>
                            <p className="text-sm text-gray-500">지금 바로 참가할 수 있는 경기들</p>
                        </div>
                        <Link 
                            href="/matches?status=registration" 
                            className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            모두 보기 
                            <ArrowRight className="w-4 h-4" />
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
                    }).slice(0, 4).length > 0 ? (
                        <div className="space-y-3">
                            {upcomingMatches.filter(match => {
                                // DB의 status가 registration인 경기만 표시
                                return match.status === 'registration';
                            }).slice(0, 4).map(match => (
                                <CompactMatchCard 
                                    key={match.id} 
                                    match={match}
                                    onView={(matchId) => router.push(`/matches/${matchId}`)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-100 rounded-lg">
                            <Trophy className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 mb-4">참가 신청 가능한 경기가 없습니다</p>
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
            <section className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="mx-auto max-w-7xl">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 lg:text-2xl">
                                팀원 모집
                            </h2>
                            <p className="text-sm text-gray-500">함께할 팀원을 찾고 있어요</p>
                        </div>
                        <Link 
                            href="/teams" 
                            className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            모두 보기 
                            <ArrowRight className="w-4 h-4" />
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
                    ) : recruitingTeams.slice(0, 4).length > 0 ? (
                        <div className="space-y-3">
                            {recruitingTeams.slice(0, 4).map(team => (
                                <CompactTeamCard 
                                    key={team.id} 
                                    team={team}
                                    onView={(teamId) => router.push(`/teams/${teamId}`)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-100 rounded-lg">
                            <UserPlus className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 mb-4">팀원을 모집 중인 팀이 없습니다</p>
                            {user ? (
                                <Link 
                                    href="/teams/create" 
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    새 팀 만들기
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

            {/* 4. 커뮤니티 섹션 */}
            <CommunitySection />

            {/* Footer */}
            <footer className="bg-gray-900 py-8 px-4 text-white mt-auto">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5" />
                            <span className="text-lg font-bold">The Match</span>
                        </div>
                        <div className="flex gap-6 text-sm text-gray-400">
                            <Link href="/matches" className="hover:text-white transition-colors">
                                경기
                            </Link>
                            <Link href="/teams" className="hover:text-white transition-colors">
                                팀
                            </Link>
                            <Link href="/community" className="hover:text-white transition-colors">
                                커뮤니티
                            </Link>
                            <button 
                                onClick={() => setShowGuideFromFooter(true)}
                                className="hover:text-white transition-colors flex items-center gap-1"
                            >
                                <HelpCircle className="w-4 h-4" />
                                시작 가이드
                            </button>
                        </div>
                        <div className="text-sm text-gray-400">
                            © 2024 The Match
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}