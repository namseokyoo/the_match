'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Clock, ArrowRight, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingTour } from '@/components/onboarding';
import { Match, Team, MatchStatus, MatchType } from '@/types';
import { formatDate } from '@/lib/utils';
import { dashboardAPI, performanceUtils } from '@/lib/api-client';

export default function Home() {
    const { user } = useAuth();
    const [activeMatches, setActiveMatches] = useState<Match[]>([]);
    const [recruitingTeams, setRecruitingTeams] = useState<Team[]>([]);
    const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMatches: 0,
        totalTeams: 0,
        totalPlayers: 0,
    });

    useEffect(() => {
        fetchDynamicContent();
    }, []);

    const fetchDynamicContent = async () => {
        try {
            setLoading(true);

            console.log('Fetching dashboard data...');
            console.time('Dashboard API Call');
            
            // 단일 API 호출로 모든 데이터 가져오기 - N+1 쿼리 방지
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

            console.timeEnd('Dashboard API Call');
            console.log('Dashboard API response:', dashboardData);

            // 데이터 설정
            if (dashboardData.success && dashboardData.data) {
                const { activeMatches, upcomingMatches, recruitingTeams, stats } = dashboardData.data;
                
                setActiveMatches(activeMatches || []);
                setUpcomingMatches(upcomingMatches || []);
                setRecruitingTeams(recruitingTeams || []);
                setStats(stats || { totalMatches: 0, totalTeams: 0, totalPlayers: 0 });

                console.log('Data loaded:', {
                    activeMatches: activeMatches?.length || 0,
                    upcomingMatches: upcomingMatches?.length || 0,
                    recruitingTeams: recruitingTeams?.length || 0,
                    stats
                });
            } else {
                // 폴백 데이터
                setActiveMatches([]);
                setRecruitingTeams([]);
                setUpcomingMatches([]);
                setStats({ totalMatches: 0, totalTeams: 0, totalPlayers: 0 });
            }

        } catch (error) {
            console.error('Error fetching dynamic content:', error);
            // 에러가 발생해도 로딩을 해제하고 빈 데이터로 표시
            setActiveMatches([]);
            setRecruitingTeams([]);
            setUpcomingMatches([]);
            setStats({ totalMatches: 0, totalTeams: 0, totalPlayers: 0 });
        } finally {
            setLoading(false);
            
            // 성능 메트릭 로그 (개발 환경에서만)
            if (process.env.NODE_ENV === 'development') {
                setTimeout(() => {
                    performanceUtils.logPerformance();
                }, 1000);
            }
        }
    };

    const getTypeLabel = (type: MatchType | string) => {
        switch (type) {
            case 'single_elimination':
                return '토너먼트';
            case 'double_elimination':
                return '더블 엘리미네이션';
            case 'round_robin':
                return '리그전';
            case 'swiss':
                return '스위스';
            case 'league':
                return '리그';
            default:
                return type;
        }
    };

    const getStatusColor = (status: MatchStatus | string) => {
        switch (status) {
            case 'registration':
                return 'bg-blue-100 text-blue-800';
            case 'in_progress':
                return 'bg-green-100 text-green-800';
            case 'completed':
                return 'bg-purple-100 text-purple-800';
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: MatchStatus | string) => {
        switch (status) {
            case 'registration':
                return '모집중';
            case 'in_progress':
                return '진행중';
            case 'completed':
                return '완료';
            case 'cancelled':
                return '취소됨';
            case 'draft':
                return '준비중';
            default:
                return status;
        }
    };


    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            {/* Onboarding Tour for new users */}
            <OnboardingTour autoStart={!!user} />
            
            {/* Hero Section - 간소화 */}
            <section className="bg-gradient-to-br from-match-blue to-match-purple px-4 py-12">
                <div className="mx-auto max-w-7xl">
                    <div className="text-center text-white mb-8">
                        <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
                            The Match
                        </h1>
                        <p className="text-lg text-white/90">
                            경기와 팀을 만나는 곳
                        </p>
                    </div>

                    {/* 통계 카드 */}
                    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                            <div className="text-2xl md:text-3xl font-bold text-white">{stats.totalMatches}</div>
                            <div className="text-sm text-white/80">경기</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                            <div className="text-2xl md:text-3xl font-bold text-white">{stats.totalTeams}</div>
                            <div className="text-sm text-white/80">팀</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                            <div className="text-2xl md:text-3xl font-bold text-white">{stats.totalPlayers}</div>
                            <div className="text-sm text-white/80">선수</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 현재 진행 중인 경기 */}
            <section className="py-8 px-4">
                <div className="mx-auto max-w-7xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            🔥 지금 진행 중인 경기
                        </h2>
                        <Link href="/matches" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            모두 보기 <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            ))}
                        </div>
                    ) : activeMatches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeMatches.map(match => (
                                <Link key={match.id} href={`/matches/${match.id}`}>
                                    <div className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-semibold text-lg text-gray-900 flex-1">
                                                {match.title}
                                            </h3>
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(match.status)}`}>
                                                {getStatusLabel(match.status)}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Trophy className="w-4 h-4" />
                                                <span>{getTypeLabel(match.type)}</span>
                                            </div>
                                            {match.start_date && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{formatDate(match.start_date)}</span>
                                                </div>
                                            )}
                                            {match.max_participants && (
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    <span>최대 {match.max_participants}팀</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg">
                            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">아직 진행 중인 경기가 없습니다</p>
                            {user ? (
                                <Link href="/matches/create" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    경기 만들기
                                </Link>
                            ) : (
                                <Link href="/signup" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    회원가입하고 시작하기
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* 팀원 모집 중 */}
            <section className="py-8 px-4 bg-white">
                <div className="mx-auto max-w-7xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            👥 팀원 모집 중
                        </h2>
                        <Link href="/teams" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            모든 팀 보기 <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : recruitingTeams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {recruitingTeams.map(team => (
                                <Link key={team.id} href={`/teams/${team.id}`}>
                                    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                                        <h3 className="font-semibold text-gray-900 mb-2">
                                            {team.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {team.description || '팀원을 모집하고 있습니다'}
                                        </p>
                                        <div className="mt-3 flex items-center text-blue-600 text-sm">
                                            <UserPlus className="w-4 h-4 mr-1" />
                                            <span>참가 신청</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">팀원을 모집 중인 팀이 없습니다</p>
                            {user && (
                                <Link href="/teams/create" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    팀 만들기
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* 곧 시작될 경기 */}
            {upcomingMatches.length > 0 && (
                <section className="py-8 px-4">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                📅 곧 시작될 경기
                            </h2>
                            <Link href="/matches?status=registration" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                참가 가능한 경기 <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upcomingMatches.map(match => (
                                <Link key={match.id} href={`/matches/${match.id}`}>
                                    <div className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {match.title}
                                                </h3>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{formatDate(match.start_date || '')}</span>
                                                    </div>
                                                    {match.registration_deadline && (
                                                        <div className="flex items-center gap-1 text-orange-600">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>마감 {formatDate(match.registration_deadline)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="py-12 px-4">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="mb-4 text-3xl font-bold text-gray-900">
                        지금 시작하세요
                    </h2>
                    <p className="mb-8 text-xl text-gray-600">
                        무료로 The Match를 체험해보고 경기 관리의 새로운 경험을 만나보세요
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {user ? (
                            <>
                                <Link href="/matches/create" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                                    경기 만들기
                                </Link>
                                <Link href="/teams/create" className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                                    팀 만들기
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/signup" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                                    무료 회원가입
                                </Link>
                                <Link href="/login" className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-semibold">
                                    로그인
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 py-8 px-4 text-white">
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