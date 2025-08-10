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
                return 'bg-primary-50 text-primary-700 border border-primary-200';
            case 'in_progress':
                return 'bg-success-50 text-success-700 border border-success-200';
            case 'completed':
                return 'bg-gray-50 text-gray-700 border border-gray-200';
            case 'draft':
                return 'bg-gray-50 text-gray-600 border border-gray-200';
            case 'cancelled':
                return 'bg-error-50 text-error-700 border border-error-200';
            default:
                return 'bg-gray-50 text-gray-600 border border-gray-200';
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

            {/* 현재 진행 중인 경기 */}
            <section className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            진행 중인 경기
                        </h2>
                        <Link href="/matches" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 text-sm">
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
                                    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-base text-gray-900 flex-1">
                                                {match.title}
                                            </h3>
                                            <div className="flex flex-col items-end">
                                                <span className={`px-2 py-0.5 text-xs rounded-md font-medium ${getStatusColor(match.status)}`}>
                                                    {getStatusLabel(match.status)}
                                                </span>
                                                {match.max_participants && (
                                                    <span className="text-xs text-gray-500 mt-1">
                                                        ({(match as any).current_participants || 0}/{match.max_participants})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Trophy className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{getTypeLabel(match.type)}</span>
                                            </div>
                                            {match.start_date && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="whitespace-nowrap">{formatDate(match.start_date)}</span>
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
                                <Link href="/matches/create" className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-sm">
                                    경기 만들기
                                </Link>
                            ) : (
                                <Link href="/signup" className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-sm">
                                    회원가입하고 시작하기
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* 팀원 모집 중 */}
            <section className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="mx-auto max-w-7xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            팀원 모집 중
                        </h2>
                        <Link href="/teams" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium transition-colors">
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
                                    <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">
                                                    {team.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {team.description || '팀원을 모집하고 있습니다'}
                                                </p>
                                            </div>
                                            <span className="px-2 py-0.5 text-xs rounded-md font-medium bg-green-50 text-green-700 border border-green-200 ml-2">
                                                모집중
                                            </span>
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
                                <Link href="/teams/create" className="inline-flex items-center px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors shadow-sm">
                                    팀 만들기
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* 참가 팀 모집 */}
            <section className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            참가 팀 모집
                        </h2>
                        <Link href="/matches?status=registration" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium transition-colors">
                            모두 보기 <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2].map(i => (
                                <div key={i} className="bg-white rounded-lg p-3 animate-pulse border border-gray-200">
                                    <div className="h-5 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            ))}
                        </div>
                    ) : upcomingMatches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upcomingMatches.map(match => (
                                <Link key={match.id} href={`/matches/${match.id}`}>
                                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {match.title}
                                                </h3>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="whitespace-nowrap">{formatDate(match.start_date || '')}</span>
                                                    </div>
                                                    {match.registration_deadline && (
                                                        <div className="flex items-center gap-1 text-orange-600">
                                                            <Calendar className="w-4 h-4" />
                                                            <span className="whitespace-nowrap">마감 {formatDate(match.registration_deadline)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="px-2 py-0.5 text-xs rounded-md font-medium bg-primary-50 text-primary-700 border border-primary-200">
                                                    모집중
                                                </span>
                                                {match.max_participants && (
                                                    <span className="text-xs text-gray-500 mt-1">
                                                        ({(match as any).current_participants || 0}/{match.max_participants})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">참가 모집 중인 경기가 없습니다</p>
                            {user && (
                                <Link href="/matches/create" className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-sm">
                                    경기 만들기
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* 통계 섹션 - 맨 아래로 이동 */}
            <section className="bg-gradient-to-br from-primary-500 to-primary-700 px-4 py-8 sm:py-12">
                <div className="mx-auto max-w-7xl">
                    {/* 제목 - 중앙 정렬 */}
                    <div className="text-center text-white mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            The Match 플랫폼 현황
                        </h2>
                        <p className="text-sm sm:text-base text-primary-100 mt-2">
                            함께 성장하는 스포츠 커뮤니티
                        </p>
                    </div>

                    {/* 통계 - 가로로 배치, 중앙 정렬 */}
                    <div className="flex justify-center gap-4 sm:gap-6">
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-6 py-4 sm:px-8 sm:py-6 text-center shadow-lg min-w-[100px] sm:min-w-[140px]">
                            <div className="text-3xl sm:text-4xl font-bold text-primary-600">{stats.totalMatches}</div>
                            <div className="text-sm sm:text-base text-gray-600 mt-1">진행된 경기</div>
                        </div>
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-6 py-4 sm:px-8 sm:py-6 text-center shadow-lg min-w-[100px] sm:min-w-[140px]">
                            <div className="text-3xl sm:text-4xl font-bold text-primary-600">{stats.totalTeams}</div>
                            <div className="text-sm sm:text-base text-gray-600 mt-1">활동 중인 팀</div>
                        </div>
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-6 py-4 sm:px-8 sm:py-6 text-center shadow-lg min-w-[100px] sm:min-w-[140px]">
                            <div className="text-3xl sm:text-4xl font-bold text-primary-600">{stats.totalPlayers}</div>
                            <div className="text-sm sm:text-base text-gray-600 mt-1">등록된 선수</div>
                        </div>
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