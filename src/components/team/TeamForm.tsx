/* eslint-disable no-unused-vars */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Team, CreateTeamForm } from '@/types';
import { Button, Input, Card } from '@/components/ui';
import { Upload, X } from 'lucide-react';

interface TeamFormProps {
    team?: Team;
    loading?: boolean;
    onSubmit: (formData: CreateTeamForm & { recruitment_count?: number; logo_file?: File }) => Promise<void>;
    onCancel?: () => void;
}

export const TeamForm: React.FC<TeamFormProps> = ({
    team,
    loading = false,
    onSubmit,
    onCancel,
}) => {
    const [formData, setFormData] = useState<CreateTeamForm & { recruitment_count?: number }>({
        name: team?.name || '',
        description: team?.description || '',
        logo_url: team?.logo_url || '',
        recruitment_count: team?.recruitment_count || undefined,
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 팀 데이터가 변경되면 폼 데이터 업데이트
    useEffect(() => {
        if (team) {
            setFormData({
                name: team.name || '',
                description: team.description || '',
                logo_url: team.logo_url || '',
                recruitment_count: team.recruitment_count || undefined,
            });
            if (team.logo_url) {
                setLogoPreview(team.logo_url);
            }
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
                recruitment_count: formData.recruitment_count || undefined,
                logo_file: logoFile || undefined,
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

                    {/* 팀 로고 업로드 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            팀 로고
                        </label>
                        <div className="flex items-center gap-4">
                            {logoPreview ? (
                                <div className="relative">
                                    <Image
                                        src={logoPreview}
                                        alt="팀 로고 미리보기"
                                        width={80}
                                        height={80}
                                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLogoFile(null);
                                            setLogoPreview(null);
                                            setFormData(prev => ({ ...prev, logo_url: '' }));
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                            }
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-gray-400" />
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 5 * 1024 * 1024) {
                                                alert('파일 크기는 5MB 이하여야 합니다.');
                                                return;
                                            }
                                            setLogoFile(file);
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setLogoPreview(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    disabled={isDisabled}
                                    className="hidden"
                                    id="logo-upload"
                                />
                                <label
                                    htmlFor="logo-upload"
                                    className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-match-blue cursor-pointer ${
                                        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    로고 업로드
                                </label>
                                <p className="mt-1 text-sm text-gray-500">
                                    JPG, PNG, GIF 형식, 최대 5MB
                                </p>
                            </div>
                        </div>
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