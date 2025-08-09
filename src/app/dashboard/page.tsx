'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Trophy, Users, Clock, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/components/ui/Toast';

interface DashboardData {
    upcomingMatches: any[];
    myTeams: any[];
    recentActivities: any[];
    stats: {
        totalMatches: number;
        totalTeams: number;
        upcomingCount: number;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading, initialized } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [dataLoading, setDataLoading] = useState(true);

    const fetchDashboardData = async () => {
        if (!user) {
            setDataLoading(false);
            return;
        }

        try {
            // 사용자의 팀 목록 조회
            const { data: teams } = await supabase
                .from('teams')
                .select('*')
                .eq('captain_id', user.id)
                .limit(5);

            // 참가 중인 경기 조회
            const { data: participatingMatches } = await supabase
                .from('match_participants')
                .select(`
                    match_id,
                    matches!inner(*)
                `)
                .eq('team_id', teams?.[0]?.id || '')
                .limit(5);

            // 최근 생성한 경기 조회
            const { data: createdMatches } = await supabase
                .from('matches')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setDashboardData({
                upcomingMatches: createdMatches || [],
                myTeams: teams || [],
                recentActivities: [],
                stats: {
                    totalMatches: createdMatches?.length || 0,
                    totalTeams: teams?.length || 0,
                    upcomingCount: createdMatches?.filter(m => 
                        new Date(m.start_date) > new Date()
                    ).length || 0,
                }
            });
        } catch (error) {
            console.error('Dashboard data fetch error:', error);
            showToast('대시보드 데이터를 불러오는데 실패했습니다', 'error');
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        // 인증이 초기화되고 사용자가 있을 때만 데이터 로드
        if (initialized && user) {
            fetchDashboardData();
        } else if (initialized && !user) {
            // 인증이 완료되었는데 사용자가 없으면 로그인 페이지로
            router.push('/login');
        }
    }, [initialized, user, router]);

    // 인증 로딩 중
    if (!initialized || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    // 데이터 로딩 중
    if (dataLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
                    <p className="mt-2 text-gray-600">
                        {user?.email?.split('@')[0]}님, 환영합니다!
                    </p>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">전체 경기</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {dashboardData?.stats.totalMatches || 0}
                                    </p>
                                </div>
                                <Trophy className="h-8 w-8 text-primary-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">내 팀</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {dashboardData?.stats.totalTeams || 0}
                                    </p>
                                </div>
                                <Users className="h-8 w-8 text-success-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">예정된 경기</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {dashboardData?.stats.upcomingCount || 0}
                                    </p>
                                </div>
                                <Calendar className="h-8 w-8 text-info-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">이번 주</p>
                                    <p className="text-2xl font-bold text-gray-900">0</p>
                                </div>
                                <Clock className="h-8 w-8 text-warning-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 예정된 경기 */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>예정된 경기</CardTitle>
                            <Link href="/matches/create">
                                <Button size="sm" variant="outline">
                                    <Plus className="h-4 w-4 mr-1" />
                                    새 경기
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {dashboardData?.upcomingMatches.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    예정된 경기가 없습니다
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {dashboardData?.upcomingMatches.map((match) => (
                                        <Link 
                                            key={match.id} 
                                            href={`/matches/${match.id}`}
                                            className="block"
                                        >
                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">
                                                        {match.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(match.start_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 내 팀 */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>내 팀</CardTitle>
                            <Link href="/teams/create">
                                <Button size="sm" variant="outline">
                                    <Plus className="h-4 w-4 mr-1" />
                                    새 팀
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {dashboardData?.myTeams.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    소속된 팀이 없습니다
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {dashboardData?.myTeams.map((team) => (
                                        <Link 
                                            key={team.id} 
                                            href={`/teams/${team.id}`}
                                            className="block"
                                        >
                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-primary-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">
                                                            {team.name}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            {team.sport_type || '미지정'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 빠른 액션 */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/matches/create">
                        <Button variant="outline" className="w-full justify-start">
                            <Trophy className="h-4 w-4 mr-2" />
                            새 경기 만들기
                        </Button>
                    </Link>
                    <Link href="/teams/create">
                        <Button variant="outline" className="w-full justify-start">
                            <Users className="h-4 w-4 mr-2" />
                            팀 생성하기
                        </Button>
                    </Link>
                    <Link href="/matches">
                        <Button variant="outline" className="w-full justify-start">
                            <Calendar className="h-4 w-4 mr-2" />
                            경기 둘러보기
                        </Button>
                    </Link>
                    <Link href="/profile">
                        <Button variant="outline" className="w-full justify-start">
                            <Clock className="h-4 w-4 mr-2" />
                            프로필 설정
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}