/* eslint-disable no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Team, CreateTeamForm, Match } from '@/types';
import { Button, Input, Card } from '@/components/ui';

interface TeamFormProps {
    team?: Team;
    matches?: Match[];
    loading?: boolean;
    onSubmit: (formData: CreateTeamForm & { match_id?: string; recruitment_count?: number }) => Promise<void>;
    onCancel?: () => void;
}

export const TeamForm: React.FC<TeamFormProps> = ({
    team,
    matches = [],
    loading = false,
    onSubmit,
    onCancel,
}) => {
    const [formData, setFormData] = useState<CreateTeamForm & { match_id?: string; recruitment_count?: number }>({
        name: team?.name || '',
        description: team?.description || '',
        logo_url: team?.logo_url || '',
        match_id: team?.match_id || '',
        recruitment_count: team?.recruitment_count || undefined,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 팀 데이터가 변경되면 폼 데이터 업데이트
    useEffect(() => {
        if (team) {
            setFormData({
                name: team.name || '',
                description: team.description || '',
                logo_url: team.logo_url || '',
                match_id: team.match_id || '',
                recruitment_count: team.recruitment_count || undefined,
            });
        }
    }, [team]);

    // 입력값 변경 핸들러
    const handleChange = (field: string, value: string | number | undefined) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));

        // 에러 초기화
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: '',
            }));
        }
    };

    // 폼 검증
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = '팀 이름은 필수입니다.';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = '팀 이름은 2글자 이상이어야 합니다.';
        } else if (formData.name.trim().length > 50) {
            newErrors.name = '팀 이름은 50글자 이하여야 합니다.';
        }

        if (formData.description && formData.description.length > 500) {
            newErrors.description = '팀 설명은 500글자 이하여야 합니다.';
        }

        if (formData.logo_url && !isValidUrl(formData.logo_url)) {
            newErrors.logo_url = '올바른 URL 형식이 아닙니다.';
        }

        if (formData.recruitment_count !== undefined && formData.recruitment_count !== null) {
            if (formData.recruitment_count < 1) {
                newErrors.recruitment_count = '모집 인원은 1명 이상이어야 합니다.';
            } else if (formData.recruitment_count > 100) {
                newErrors.recruitment_count = '모집 인원은 100명 이하여야 합니다.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // URL 검증 함수
    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await onSubmit({
                name: formData.name.trim(),
                description: formData.description?.trim() || undefined,
                logo_url: formData.logo_url?.trim() || undefined,
                match_id: formData.match_id || undefined,
                recruitment_count: formData.recruitment_count || undefined,
            });
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDisabled = loading || isSubmitting;

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {team ? '팀 정보 수정' : '새 팀 만들기'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 팀 이름 */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            팀 이름 *
                        </label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="팀 이름을 입력하세요"
                            value={formData.name}
                            onChange={(value) => handleChange('name', value)}
                            disabled={isDisabled}
                            required
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    {/* 팀 설명 */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            팀 설명
                        </label>
                        <textarea
                            id="description"
                            rows={4}
                            placeholder="팀에 대한 설명을 입력하세요"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            disabled={isDisabled}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-match-blue focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${errors.description ? 'border-red-500' : ''
                                }`}
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                            {formData.description?.length || 0}/500
                        </p>
                    </div>

                    {/* 팀 로고 URL */}
                    <div>
                        <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-2">
                            팀 로고 URL
                        </label>
                        <Input
                            id="logo_url"
                            type="url"
                            placeholder="https://example.com/logo.png"
                            value={formData.logo_url}
                            onChange={(value) => handleChange('logo_url', value)}
                            disabled={isDisabled}
                            className={errors.logo_url ? 'border-red-500' : ''}
                        />
                        {errors.logo_url && (
                            <p className="mt-1 text-sm text-red-600">{errors.logo_url}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                            팀 로고 이미지 URL을 입력하세요 (선택사항)
                        </p>
                    </div>

                    {/* 모집 인원 */}
                    <div>
                        <label htmlFor="recruitment_count" className="block text-sm font-medium text-gray-700 mb-2">
                            모집 인원
                        </label>
                        <Input
                            id="recruitment_count"
                            type="number"
                            placeholder="선수 모집 인원을 입력하세요"
                            value={formData.recruitment_count?.toString() || ''}
                            onChange={(value) => handleChange('recruitment_count', value ? parseInt(value) : undefined)}
                            disabled={isDisabled}
                            min="1"
                            max="100"
                            className={errors.recruitment_count ? 'border-red-500' : ''}
                        />
                        {errors.recruitment_count && (
                            <p className="mt-1 text-sm text-red-600">{errors.recruitment_count}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                            팀에서 모집할 선수 인원을 입력하세요 (선택사항)
                        </p>
                    </div>

                    {/* 경기 선택 */}
                    {matches.length > 0 && (
                        <div>
                            <label htmlFor="match_id" className="block text-sm font-medium text-gray-700 mb-2">
                                참가할 경기
                            </label>
                            <select
                                id="match_id"
                                value={formData.match_id}
                                onChange={(e) => handleChange('match_id', e.target.value)}
                                disabled={isDisabled}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-match-blue focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            >
                                <option value="">경기를 선택하세요 (선택사항)</option>
                                {matches.map((match) => (
                                    <option key={match.id} value={match.id}>
                                        {match.title}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-sm text-gray-500">
                                특정 경기에 참가할 팀이라면 선택하세요
                            </p>
                        </div>
                    )}

                    {/* 로고 미리보기 */}
                    {formData.logo_url && isValidUrl(formData.logo_url) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                로고 미리보기
                            </label>
                            <Image
                                src={formData.logo_url}
                                alt="팀 로고 미리보기"
                                width={64}
                                height={64}
                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    {/* 버튼 그룹 */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={isDisabled}
                            loading={isSubmitting}
                            className="sm:flex-1"
                        >
                            {team ? '팀 정보 수정' : '팀 만들기'}
                        </Button>

                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={onCancel}
                                disabled={isDisabled}
                                className="sm:flex-1"
                            >
                                취소
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </Card>
    );
};

export default TeamForm;