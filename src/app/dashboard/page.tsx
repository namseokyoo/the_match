'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Button } from '@/components/ui';
import { Match, Team, MatchStatus } from '@/types';
import { formatDate } from '@/lib/utils';

interface DashboardStats {
    totalMatches: number;
    activeMatches: number;
    myTeams: number;
    upcomingGames: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading, initialized } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalMatches: 0,
        activeMatches: 0,
        myTeams: 0,
        upcomingGames: 0,
    });
    const [myMatches, setMyMatches] = useState<Match[]>([]);
    const [myTeams, setMyTeams] = useState<Team[]>([]);
    const [recentMatches, setRecentMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataFetched, setDataFetched] = useState(false);

    useEffect(() => {
        // 인증이 초기화되고 사용자가 없으면 로그인 페이지로
        if (initialized && !user) {
            router.push('/login');
            return;
        }
        
        // 인증이 초기화되고 사용자가 있으며 데이터를 아직 가져오지 않았으면 fetch
        if (initialized && user && !dataFetched) {
            fetchDashboardData();
        }
    }, [user, initialized, router, dataFetched]);

    const fetchDashboardData = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setDataFetched(true);

            // 내가 생성한 경기들
            const { data: createdMatches, error: matchError } = await supabase
                .from('matches')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            if (matchError) {
                console.error('Matches fetch error:', matchError);
            } else {
                setMyMatches(createdMatches || []);
            }

            // 내가 캡틴인 팀들
            const { data: captainTeams, error: teamError } = await supabase
                .from('teams')
                .select('*')
                .eq('captain_id', user.id)
                .order('created_at', { ascending: false });

            if (teamError) {
                console.error('Teams fetch error:', teamError);
            } else {
                setMyTeams(captainTeams || []);
            }

            // 최근 경기들
            const { data: recent, error: recentError } = await supabase
                .from('matches')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (recentError) {
                console.error('Recent matches fetch error:', recentError);
            } else {
                setRecentMatches(recent || []);
            }

            // 통계 계산
            const activeCount = (createdMatches || []).filter(
                m => m.status === MatchStatus.REGISTRATION || m.status === MatchStatus.IN_PROGRESS
            ).length;

            setStats({
                totalMatches: createdMatches?.length || 0,
                activeMatches: activeCount,
                myTeams: captainTeams?.length || 0,
                upcomingGames: 0, // TODO: 실제 게임 일정 데이터 연동
            });

        } catch (error) {
            console.error('Dashboard data fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    // 초기 인증 로딩 중
    if (!initialized) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-match-blue"></div>
            </div>
        );
    }

    // 인증 완료 후 사용자 없음 (로그인 페이지로 리다이렉트 중)
    if (initialized && !user) {
        return null;
    }

    // 데이터 로딩 중
    if (loading && !dataFetched) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-match-blue"></div>
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
                        안녕하세요, {user?.email || '사용자'}님! 여기서 모든 활동을 한눈에 확인하세요.
                    </p>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-medium text-gray-500">내 경기</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalMatches}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-medium text-gray-500">진행 중</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.activeMatches}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 11a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-medium text-gray-500">내 팀</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.myTeams}</p>
                            </div>
                        </div>
                    </Card>

                    <Link href="/matches/calendar">
                        <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="p-3 bg-orange-100 rounded-lg">
                                        <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5">
                                    <p className="text-sm font-medium text-gray-500">캘린더 보기</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.upcomingGames}</p>
                                    <p className="text-xs text-gray-500 mt-1">예정 경기</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>

                {/* 내 경기 목록 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 내가 생성한 경기 */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">내가 주최한 경기</h2>
                            <Link href="/matches/create">
                                <Button size="sm" variant="primary">
                                    새 경기 만들기
                                </Button>
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {myMatches.length > 0 ? (
                                myMatches.slice(0, 5).map(match => (
                                    <Card key={match.id} className="p-4">
                                        <Link href={`/matches/${match.id}`}>
                                            <div className="flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{match.title}</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {formatDate(match.created_at)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        match.status === MatchStatus.REGISTRATION 
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : match.status === MatchStatus.IN_PROGRESS
                                                            ? 'bg-green-100 text-green-800'
                                                            : match.status === MatchStatus.COMPLETED
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {match.status}
                                                    </span>
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </Link>
                                    </Card>
                                ))
                            ) : (
                                <Card className="p-8 text-center">
                                    <p className="text-gray-500">아직 생성한 경기가 없습니다.</p>
                                    <Link href="/matches/create">
                                        <Button className="mt-4" variant="primary">
                                            첫 경기 만들기
                                        </Button>
                                    </Link>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* 내 팀 목록 */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">내 팀</h2>
                            <Link href="/teams/create">
                                <Button size="sm" variant="primary">
                                    새 팀 만들기
                                </Button>
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {myTeams.length > 0 ? (
                                myTeams.slice(0, 5).map(team => (
                                    <Card key={team.id} className="p-4">
                                        <Link href={`/teams/${team.id}`}>
                                            <div className="flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{team.name}</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {team.description || '팀 설명 없음'}
                                                    </p>
                                                </div>
                                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </Link>
                                    </Card>
                                ))
                            ) : (
                                <Card className="p-8 text-center">
                                    <p className="text-gray-500">아직 생성한 팀이 없습니다.</p>
                                    <Link href="/teams/create">
                                        <Button className="mt-4" variant="primary">
                                            첫 팀 만들기
                                        </Button>
                                    </Link>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>

                {/* 최근 경기 */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">최근 경기</h2>
                        <Link href="/matches">
                            <Button size="sm" variant="secondary">
                                모든 경기 보기
                            </Button>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentMatches.map(match => (
                            <Card key={match.id} className="p-4">
                                <Link href={`/matches/${match.id}`}>
                                    <div className="hover:bg-gray-50 transition-colors rounded-lg">
                                        <h3 className="font-semibold text-gray-900 mb-2">{match.title}</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {match.description || '설명 없음'}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">
                                                {formatDate(match.created_at)}
                                            </span>
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                match.status === MatchStatus.REGISTRATION 
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : match.status === MatchStatus.IN_PROGRESS
                                                    ? 'bg-green-100 text-green-800'
                                                    : match.status === MatchStatus.COMPLETED
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {match.status}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}