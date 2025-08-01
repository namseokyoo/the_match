'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Match, CreateTeamForm } from '@/types';
import { TeamForm } from '@/components/team';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function CreateTeamPage() {
    const [tournaments, setTournaments] = useState<Match[]>([]);
    const [loading, setLoading] = useState(false);
    const [tournamentsLoading, setTournamentsLoading] = useState(true);

    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // 매치 목록 조회 (팀이 참가할 수 있는 매치들)
    const fetchTournaments = async () => {
        try {
            setTournamentsLoading(true);

            const { data, error } = await supabase
                .from('matches')
                .select('id, title, status, type, creator_id, created_at, updated_at')
                .in('status', ['draft', 'registration'])
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Matches fetch error:', error);
                setTournaments([]);
            } else {
                // 타입 변환
                const matches: Match[] = (data || []).map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    status: item.status,
                    type: item.type,
                    creator_id: item.creator_id,
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                    description: undefined,
                    max_participants: undefined,
                    registration_deadline: undefined,
                    start_date: undefined,
                    end_date: undefined,
                    rules: undefined,
                    settings: undefined,
                }));
                setTournaments(matches);
            }
        } catch (error) {
            console.error('Matches fetch error:', error);
            setTournaments([]);
        } finally {
            setTournamentsLoading(false);
        }
    };

    // 컴포넌트 마운트 시 토너먼트 목록 로드
    useEffect(() => {
        fetchTournaments();
    }, []);

    // 로그인 상태 확인
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // 팀 생성 핸들러
    const handleCreateTeam = async (formData: CreateTeamForm & { match_id?: string }) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            router.push('/login');
            return;
        }

        setLoading(true);

        try {
            // 클라이언트에서 직접 Supabase 접근
            const { data: team, error } = await supabase
                .from('teams')
                .insert({
                    name: formData.name,
                    description: formData.description,
                    logo_url: formData.logo_url,
                    match_id: formData.match_id,
                    captain_id: user.id,
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    // 중복 키 에러 (팀 이름 중복)
                    alert('이미 동일한 이름의 팀이 해당 토너먼트에 존재합니다.');
                } else {
                    console.error('Team creation error:', error);
                    alert('팀 생성에 실패했습니다: ' + error.message);
                }
                return;
            }

            // 성공 메시지 및 리다이렉트
            alert('팀이 성공적으로 생성되었습니다!');
            router.push(`/teams/${team.id}`);
        } catch (error) {
            console.error('Team creation error:', error);
            alert('팀 생성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 취소 핸들러
    const handleCancel = () => {
        router.push('/teams');
    };

    // 로딩 상태 (인증 확인 중)
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-match-blue"></div>
            </div>
        );
    }

    // 로그인하지 않은 사용자
    if (!user) {
        return null; // useEffect에서 리다이렉트 처리
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 페이지 헤더 */}
                <div className="mb-8">
                    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                        <button
                            onClick={() => router.push('/teams')}
                            className="hover:text-gray-700 transition-colors"
                        >
                            팀 목록
                        </button>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-gray-900 font-medium">새 팀 만들기</span>
                    </nav>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">새 팀 만들기</h1>
                        <p className="text-gray-600">
                            새로운 팀을 생성하고 선수들을 관리하세요. 토너먼트에 참가할 팀이라면 토너먼트를 선택해주세요.
                        </p>
                    </div>
                </div>

                {/* 안내 정보 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                팀 생성 안내
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>팀을 생성하면 자동으로 팀 주장이 됩니다.</li>
                                    <li>팀 생성 후 선수를 추가하고 관리할 수 있습니다.</li>
                                    <li>토너먼트에 참가할 팀이라면 참가할 토너먼트를 선택하세요.</li>
                                    <li>팀 로고는 URL을 통해 설정할 수 있습니다.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 팀 생성 폼 */}
                <TeamForm
                    matches={tournaments}
                    loading={loading || tournamentsLoading}
                    onSubmit={handleCreateTeam}
                    onCancel={handleCancel}
                />

                {/* 추가 정보 */}
                <div className="mt-8 bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">다음 단계</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-match-blue rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    1
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">선수 추가</h4>
                                <p className="text-sm text-gray-600">팀 생성 후 선수들을 추가하고 포지션을 설정하세요.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-match-blue rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    2
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">토너먼트 참가</h4>
                                <p className="text-sm text-gray-600">완성된 팀으로 토너먼트에 참가하여 경기를 펼치세요.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-match-blue rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    3
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">경기 관리</h4>
                                <p className="text-sm text-gray-600">경기 결과를 기록하고 팀 통계를 확인하세요.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}