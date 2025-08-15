'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Match, MatchType } from '@/types';
import { Button, Input, Textarea } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { calculateMatchStatus, getMatchStatusLabel, getMatchStatusColor } from '@/lib/match-utils';

export default function EditMatchPage() {
    const router = useRouter();
    const params = useParams();
    const matchId = params.id as string;
    const { user, loading: authLoading } = useAuth();

    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: MatchType.SINGLE_ELIMINATION,
        max_participants: 16,
        registration_start_date: '',
        registration_deadline: '',
        start_date: '',
        end_date: '',
        venue: '',
        rules: '',
        prizes: '',
        settings: {} as Record<string, any>,
    });

    // 경기 정보 조회
    useEffect(() => {
        const fetchMatch = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('matches')
                    .select('*')
                    .eq('id', matchId)
                    .single();

                if (error) throw error;

                if (!data) {
                    setError('경기를 찾을 수 없습니다.');
                    return;
                }

                // 권한 체크
                if (data.creator_id !== user?.id) {
                    setError('이 경기를 수정할 권한이 없습니다.');
                    return;
                }

                setMatch(data as Match);
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    type: data.type || MatchType.SINGLE_ELIMINATION,
                    max_participants: data.max_participants || 16,
                    registration_start_date: data.registration_start_date ? 
                        new Date(data.registration_start_date).toISOString().slice(0, 16) : '',
                    registration_deadline: data.registration_deadline ? 
                        new Date(data.registration_deadline).toISOString().slice(0, 16) : '',
                    start_date: data.start_date ? 
                        new Date(data.start_date).toISOString().slice(0, 16) : '',
                    end_date: data.end_date ? 
                        new Date(data.end_date).toISOString().slice(0, 16) : '',
                    venue: data.venue || '',
                    rules: typeof data.rules === 'string' ? data.rules : JSON.stringify(data.rules || {}),
                    prizes: data.prizes || '',
                    settings: data.settings || {},
                });
            } catch (err) {
                console.error('경기 조회 오류:', err);
                setError(err instanceof Error ? err.message : '경기를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (user && !authLoading) {
            fetchMatch();
        }
    }, [matchId, user, authLoading]);

    const handleInputChange = (name: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            // 규칙 파싱
            let rulesData = {};
            if (formData.rules) {
                try {
                    rulesData = JSON.parse(formData.rules);
                } catch {
                    rulesData = { text: formData.rules };
                }
            }

            // 상태 자동 계산
            const calculatedStatus = calculateMatchStatus(
                formData.registration_start_date,
                formData.registration_deadline,
                formData.start_date,
                formData.end_date,
                match?.status
            );

            const updateData = {
                title: formData.title.trim(),
                description: formData.description?.trim() || null,
                type: formData.type,
                status: calculatedStatus,
                max_participants: formData.max_participants,
                registration_start_date: formData.registration_start_date || null,
                registration_deadline: formData.registration_deadline || null,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                venue: formData.venue?.trim() || null,
                rules: rulesData,
                prizes: formData.prizes?.trim() || null,
                settings: formData.settings,
                updated_at: new Date().toISOString(),
            };

            const { error: updateError } = await supabase
                .from('matches')
                .update(updateData)
                .eq('id', matchId)
                .eq('creator_id', user.id); // 추가 보안

            if (updateError) throw updateError;

            alert('경기가 성공적으로 수정되었습니다.');
            router.push(`/matches/${matchId}`);
        } catch (err) {
            console.error('경기 수정 오류:', err);
            setError(err instanceof Error ? err.message : '경기 수정에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-match-blue"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">오류</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button onClick={() => router.push('/matches')} variant="primary">
                        경기 목록으로
                    </Button>
                </div>
            </div>
        );
    }

    if (!match) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">경기를 찾을 수 없습니다</h2>
                    <Button onClick={() => router.push('/matches')} variant="primary">
                        경기 목록으로
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">경기 수정</h1>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                경기 제목 *
                            </label>
                            <Input
                                type="text"
                                value={formData.title}
                                onChange={(value) => handleInputChange('title', value)}
                                required
                                placeholder="예: 2024 봄 축구 리그"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                설명
                            </label>
                            <Textarea
                                value={formData.description}
                                onChange={(value) => handleInputChange('description', value)}
                                rows={4}
                                placeholder="경기에 대한 상세 설명을 입력하세요"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    경기 형식
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-match-blue"
                                >
                                    <option value={MatchType.SINGLE_ELIMINATION}>싱글 토너먼트</option>
                                    <option value={MatchType.DOUBLE_ELIMINATION}>더블 토너먼트</option>
                                    <option value={MatchType.ROUND_ROBIN}>리그전</option>
                                    <option value={MatchType.SWISS}>스위스</option>
                                    <option value={MatchType.LEAGUE}>리그</option>
                                </select>
                            </div>
                        </div>

                        {/* 자동 계산된 상태 표시 */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">현재 상태</span>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                    getMatchStatusColor(calculateMatchStatus(
                                        formData.registration_start_date,
                                        formData.registration_deadline,
                                        formData.start_date,
                                        formData.end_date,
                                        match?.status
                                    ))
                                }`}>
                                    {getMatchStatusLabel(calculateMatchStatus(
                                        formData.registration_start_date,
                                        formData.registration_deadline,
                                        formData.start_date,
                                        formData.end_date,
                                        match?.status
                                    ))}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                상태는 설정한 날짜에 따라 자동으로 변경됩니다.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    최대 참가 팀 수
                                </label>
                                <Input
                                    type="number"
                                    value={formData.max_participants.toString()}
                                    onChange={(value) => handleInputChange('max_participants', parseInt(value) || 16)}
                                    min="2"
                                    max="256"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    등록 시작일
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.registration_start_date}
                                    onChange={(e) => handleInputChange('registration_start_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-match-blue"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    등록 마감일
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.registration_deadline}
                                    onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-match-blue"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    경기 시작일
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.start_date}
                                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-match-blue"
                                />
                            </div>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    경기 종료일
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.end_date}
                                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-match-blue"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                장소
                            </label>
                            <Input
                                type="text"
                                value={formData.venue}
                                onChange={(value) => handleInputChange('venue', value)}
                                placeholder="예: 서울 월드컵 경기장"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                규칙 (JSON 형식 또는 텍스트)
                            </label>
                            <Textarea
                                value={formData.rules}
                                onChange={(value) => handleInputChange('rules', value)}
                                rows={4}
                                placeholder="경기 규칙을 입력하세요"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                상품
                            </label>
                            <Textarea
                                value={formData.prizes}
                                onChange={(value) => handleInputChange('prizes', value)}
                                rows={2}
                                placeholder="우승 상품 등을 입력하세요"
                            />
                        </div>

                        <div className="flex justify-end space-x-4 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => router.push(`/matches/${matchId}`)}
                                disabled={saving}
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={saving || !formData.title.trim()}
                            >
                                {saving ? '저장 중...' : '수정하기'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}