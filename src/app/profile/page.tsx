'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Team, Match, Player, TeamJoinRequest } from '@/types';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Clock, Check, X } from 'lucide-react';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    created_at: string;
    updated_at?: string;
}

function ProfileContent() {
    const { user, session, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [myTeams, setMyTeams] = useState<Team[]>([]);
    const [myMatches, setMyMatches] = useState<Match[]>([]);
    const [myPlayerProfiles, setMyPlayerProfiles] = useState<Player[]>([]);
    const [myJoinRequests, setMyJoinRequests] = useState<TeamJoinRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
    });

    // 프로필 정보 조회
    const fetchProfile = useCallback(async () => {
        if (!user || !session) {
            console.log('[Profile] No user or session available');
            return;
        }

        try {
            setLoading(true);
            console.log('[Profile] Fetching profile for user:', user.email);

            // 사용자 프로필 조회
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Profile fetch error:', profileError);
            }

            // 프로필이 없으면 생성
            if (!profileData) {
                const newProfile = {
                    id: user.id,
                    email: user.email || '',
                    created_at: new Date().toISOString(),
                };

                const { data: createdProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert([newProfile])
                    .select()
                    .single();

                if (createError) {
                    console.error('Profile creation error:', createError);
                } else {
                    setProfile(createdProfile);
                    setFormData({
                        full_name: createdProfile.full_name || '',
                        bio: createdProfile.bio || '',
                    });
                }
            } else {
                setProfile(profileData);
                setFormData({
                    full_name: profileData.full_name || '',
                    bio: profileData.bio || '',
                });
            }

            // 내가 만든 팀 조회
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('*')
                .eq('captain_id', user.id)
                .order('created_at', { ascending: false });

            if (teamsError) {
                console.error('Teams fetch error:', teamsError);
            } else {
                setMyTeams(teamsData || []);
            }

            // 내가 만든 경기 조회
            const { data: matchesData, error: matchesError } = await supabase
                .from('matches')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            if (matchesError) {
                console.error('Matches fetch error:', matchesError);
            } else {
                setMyMatches(matchesData || []);
            }

            // 내 선수 프로필 조회 (이메일로 매칭)
            if (user.email) {
                const { data: playersData, error: playersError } = await supabase
                    .from('players')
                    .select('*, team:teams(*)')
                    .eq('email', user.email);

                if (playersError) {
                    console.error('Players fetch error:', playersError);
                } else {
                    setMyPlayerProfiles(playersData || []);
                }
            }

            // 내 팀 가입 신청 조회
            const { data: joinRequestsData, error: joinRequestsError } = await supabase
                .from('team_join_requests')
                .select('*, team:teams(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (joinRequestsError) {
                console.error('Join requests fetch error:', joinRequestsError);
            } else {
                setMyJoinRequests(joinRequestsData || []);
            }

        } catch (err) {
            console.error('Profile fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [user, session]);

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        console.log('[Profile] Auth state:', { authLoading, user: user?.email, session: !!session });
        
        // 인증 로딩이 완료되고 사용자와 세션이 모두 있을 때만 프로필 로드
        if (!authLoading && user && session) {
            fetchProfile();
        } else if (!authLoading && !user) {
            // 인증 로딩이 완료되었는데 사용자가 없으면 로딩 상태 해제
            setLoading(false);
        }
    }, [authLoading, user, session, fetchProfile]);

    // 프로필 수정
    const handleSaveProfile = async () => {
        if (!user || !profile) return;

        try {
            const updateData = {
                full_name: formData.full_name.trim() || null,
                bio: formData.bio.trim() || null,
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id)
                .select()
                .single();

            if (error) {
                console.error('Profile update error:', error);
                alert('프로필 수정에 실패했습니다.');
            } else {
                setProfile(data);
                setIsEditing(false);
                alert('프로필이 성공적으로 수정되었습니다.');
            }
        } catch (err) {
            console.error('Profile update error:', err);
            alert('프로필 수정 중 오류가 발생했습니다.');
        }
    };

    // 로그아웃
    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Sign out error:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        } else {
            router.push('/');
        }
    };

    // 인증 확인 중
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <SkeletonLoader variant="card" count={3} className="mb-6" />
                </div>
            </div>
        );
    }

    // 로그인하지 않은 상태
    if (!user || !session) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
                    <p className="text-gray-600 mb-6">프로필을 보려면 먼저 로그인해주세요.</p>
                    <Button
                        onClick={() => router.push('/login')}
                        variant="primary"
                    >
                        로그인하기
                    </Button>
                </div>
            </div>
        );
    }

    // 데이터 로딩 중
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <SkeletonLoader variant="card" count={3} className="mb-6" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 프로필 헤더 */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
                    <div className="h-32 bg-gradient-to-r from-match-blue to-blue-600"></div>
                    
                    <div className="px-6 pb-6">
                        <div className="flex items-end -mt-16 mb-4">
                            <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                                {profile?.avatar_url ? (
                                    <Image
                                        src={profile.avatar_url}
                                        alt={profile.full_name || '프로필'}
                                        width={128}
                                        height={128}
                                        className="w-full h-full rounded-full object-cover"
                                        unoptimized={true}
                                    />
                                ) : (
                                    <svg className="w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                )}
                            </div>
                            
                            <div className="ml-auto space-x-2">
                                {isEditing ? (
                                    <>
                                        <Button
                                            onClick={handleSaveProfile}
                                            variant="primary"
                                            size="sm"
                                        >
                                            저장
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setFormData({
                                                    full_name: profile?.full_name || '',
                                                    bio: profile?.bio || '',
                                                });
                                            }}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            취소
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={() => setIsEditing(true)}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            프로필 수정
                                        </Button>
                                        <Button
                                            onClick={handleSignOut}
                                            variant="secondary"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            로그아웃
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        이름
                                    </label>
                                    <Input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(value) => setFormData(prev => ({ ...prev, full_name: value }))}
                                        placeholder="홍길동"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        소개
                                    </label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                        placeholder="간단한 자기소개를 작성해주세요."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-match-blue focus:border-transparent"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {profile?.full_name || '이름 미설정'}
                                </h1>
                                <p className="text-gray-600">{profile?.email}</p>
                                {profile?.bio && (
                                    <p className="text-gray-700 mt-2">{profile.bio}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{myMatches.length}</p>
                        <p className="text-sm text-gray-500">주최 경기</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{myTeams.length}</p>
                        <p className="text-sm text-gray-500">운영 팀</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{myPlayerProfiles.length}</p>
                        <p className="text-sm text-gray-500">선수 프로필</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">
                            {profile?.created_at ? 
                                Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
                                : 0
                            }
                        </p>
                        <p className="text-sm text-gray-500">가입일수</p>
                    </div>
                </div>

                {/* 내가 주최한 경기 */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">내가 주최한 경기</h2>
                    {myMatches.length === 0 ? (
                        <p className="text-gray-500 text-sm">아직 주최한 경기가 없습니다.</p>
                    ) : (
                        <div className="space-y-3">
                            {myMatches.slice(0, 5).map((match) => (
                                <div
                                    key={match.id}
                                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                                    onClick={() => router.push(`/matches/${match.id}`)}
                                >
                                    <div>
                                        <h3 className="font-medium text-gray-900">{match.title}</h3>
                                        <p className="text-sm text-gray-500">
                                            {new Date(match.created_at).toLocaleDateString('ko-KR')}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        match.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                        match.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        {match.status === 'completed' ? '종료' :
                                         match.status === 'in_progress' ? '진행중' : '모집중'}
                                    </span>
                                </div>
                            ))}
                            {myMatches.length > 5 && (
                                <button
                                    onClick={() => router.push('/matches?filter=my')}
                                    className="text-match-blue text-sm hover:underline"
                                >
                                    모두 보기 ({myMatches.length}개)
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 팀 가입 신청 현황 */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">팀 가입 신청 현황</h2>
                    {myJoinRequests.length === 0 ? (
                        <p className="text-gray-500 text-sm">팀 가입 신청 내역이 없습니다.</p>
                    ) : (
                        <div className="space-y-3">
                            {myJoinRequests.map((request) => (
                                <Card key={request.id} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium">
                                                    {request.team?.name || '알 수 없는 팀'}
                                                </h3>
                                                <div className="flex items-center gap-1">
                                                    {request.status === 'pending' && (
                                                        <>
                                                            <Clock className="w-4 h-4 text-yellow-500" />
                                                            <span className="text-sm text-yellow-600">승인 대기중</span>
                                                        </>
                                                    )}
                                                    {request.status === 'approved' && (
                                                        <>
                                                            <Check className="w-4 h-4 text-green-500" />
                                                            <span className="text-sm text-green-600">승인됨</span>
                                                        </>
                                                    )}
                                                    {request.status === 'rejected' && (
                                                        <>
                                                            <X className="w-4 h-4 text-red-500" />
                                                            <span className="text-sm text-red-600">거절됨</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                신청일: {formatDate(request.created_at)}
                                            </p>
                                            {request.responded_at && (
                                                <p className="text-sm text-gray-500">
                                                    처리일: {formatDate(request.responded_at)}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => router.push(`/teams/${request.team_id}`)}
                                        >
                                            팀 보기
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* 내가 운영하는 팀 */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">내가 운영하는 팀</h2>
                    {myTeams.length === 0 ? (
                        <p className="text-gray-500 text-sm">아직 운영하는 팀이 없습니다.</p>
                    ) : (
                        <div className="space-y-3">
                            {myTeams.slice(0, 5).map((team) => (
                                <div
                                    key={team.id}
                                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                                    onClick={() => router.push(`/teams/${team.id}`)}
                                >
                                    <div className="flex items-center space-x-3">
                                        {team.logo_url ? (
                                            <Image
                                                src={team.logo_url}
                                                alt={team.name}
                                                width={40}
                                                height={40}
                                                className="w-10 h-10 rounded-full object-cover"
                                                unoptimized={true}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-medium text-gray-900">{team.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(team.created_at).toLocaleDateString('ko-KR')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {myTeams.length > 5 && (
                                <button
                                    onClick={() => router.push('/teams?filter=my')}
                                    className="text-match-blue text-sm hover:underline"
                                >
                                    모두 보기 ({myTeams.length}개)
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 내 선수 프로필 */}
                {myPlayerProfiles.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">내 선수 프로필</h2>
                        <div className="space-y-3">
                            {myPlayerProfiles.map((player) => (
                                <div
                                    key={player.id}
                                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                                    onClick={() => router.push(`/players/${player.id}`)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <span className="text-lg font-bold text-gray-600">
                                                {player.jersey_number || '?'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {player.name}
                                                {player.position && (
                                                    <span className="ml-2 text-sm text-gray-500">
                                                        {player.position}
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {(player as any).team?.name || '소속팀 없음'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-match-blue"></div>
            </div>
        }>
            <ProfileContent />
        </Suspense>
    );
}