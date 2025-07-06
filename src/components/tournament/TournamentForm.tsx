import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tournament, TournamentType, TournamentStatus, CreateTournamentForm } from '@/types';

interface TournamentFormProps {
    tournament?: Tournament;
    onSubmit: (data: CreateTournamentForm) => Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
    mode?: 'create' | 'edit';
}

// 토너먼트 타입 옵션
const tournamentTypeOptions = [
    { value: TournamentType.SINGLE_ELIMINATION, label: '단일 토너먼트' },
    { value: TournamentType.DOUBLE_ELIMINATION, label: '더블 토너먼트' },
    { value: TournamentType.ROUND_ROBIN, label: '리그전' },
    { value: TournamentType.SWISS, label: '스위스' },
    { value: TournamentType.LEAGUE, label: '리그' },
];

export const TournamentForm: React.FC<TournamentFormProps> = ({
    tournament,
    onSubmit,
    onCancel,
    isLoading = false,
    mode = 'create',
}) => {
    const [formData, setFormData] = useState<CreateTournamentForm>({
        title: tournament?.title || '',
        description: tournament?.description || '',
        type: tournament?.type || TournamentType.SINGLE_ELIMINATION,
        max_participants: tournament?.max_participants || undefined,
        registration_deadline: tournament?.registration_deadline || '',
        start_date: tournament?.start_date || '',
        end_date: tournament?.end_date || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // 폼 검증
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // 필수 필드 검증
        if (!formData.title.trim()) {
            newErrors.title = '토너먼트 제목을 입력해주세요.';
        } else if (formData.title.length < 2) {
            newErrors.title = '제목은 최소 2글자 이상이어야 합니다.';
        } else if (formData.title.length > 100) {
            newErrors.title = '제목은 100글자를 초과할 수 없습니다.';
        }

        if (formData.description && formData.description.length > 500) {
            newErrors.description = '설명은 500글자를 초과할 수 없습니다.';
        }

        if (formData.max_participants && formData.max_participants < 2) {
            newErrors.max_participants = '최소 2팀 이상이어야 합니다.';
        }

        if (formData.max_participants && formData.max_participants > 1000) {
            newErrors.max_participants = '최대 1000팀까지 가능합니다.';
        }

        // 날짜 검증
        const now = new Date();
        const registrationDeadline = formData.registration_deadline ? new Date(formData.registration_deadline) : null;
        const startDate = formData.start_date ? new Date(formData.start_date) : null;
        const endDate = formData.end_date ? new Date(formData.end_date) : null;

        if (registrationDeadline && registrationDeadline < now) {
            newErrors.registration_deadline = '등록 마감일은 현재 시간 이후여야 합니다.';
        }

        if (startDate && startDate < now) {
            newErrors.start_date = '시작일은 현재 시간 이후여야 합니다.';
        }

        if (registrationDeadline && startDate && registrationDeadline > startDate) {
            newErrors.registration_deadline = '등록 마감일은 시작일 이전이어야 합니다.';
        }

        if (startDate && endDate && startDate > endDate) {
            newErrors.end_date = '종료일은 시작일 이후여야 합니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof CreateTournamentForm, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // 해당 필드 에러 제거
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('폼 제출 오류:', error);
        }
    };

    const formatDateForInput = (dateString: string): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-xl font-bold">
                    {mode === 'create' ? '새 토너먼트 만들기' : '토너먼트 수정'}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 제목 */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            토너먼트 제목 *
                        </label>
                        <Input
                            id="title"
                            type="text"
                            value={formData.title}
                            onChange={(value) => handleInputChange('title', value)}
                            placeholder="토너먼트 제목을 입력하세요"
                            disabled={isLoading}
                            className={errors.title ? 'border-red-500' : ''}
                        />
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    </div>

                    {/* 설명 */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            설명
                        </label>
                        <textarea
                            id="description"
                            value={formData.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="토너먼트에 대한 설명을 입력하세요"
                            disabled={isLoading}
                            rows={3}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-match-blue focus:border-transparent resize-vertical ${errors.description ? 'border-red-500' : ''
                                }`}
                        />
                        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                    </div>

                    {/* 토너먼트 타입 */}
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                            토너먼트 유형 *
                        </label>
                        <select
                            id="type"
                            value={formData.type}
                            onChange={(e) => handleInputChange('type', e.target.value as TournamentType)}
                            disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-match-blue focus:border-transparent"
                        >
                            {tournamentTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 최대 참가팀 수 */}
                    <div>
                        <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700 mb-1">
                            최대 참가팀 수
                        </label>
                        <Input
                            id="max_participants"
                            type="number"
                            value={formData.max_participants?.toString() || ''}
                            onChange={(value) => handleInputChange('max_participants', value ? parseInt(value) : undefined)}
                            placeholder="예: 16"
                            disabled={isLoading}
                            className={errors.max_participants ? 'border-red-500' : ''}
                        />
                        {errors.max_participants && <p className="text-red-500 text-sm mt-1">{errors.max_participants}</p>}
                    </div>

                    {/* 날짜 설정 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="registration_deadline" className="block text-sm font-medium text-gray-700 mb-1">
                                등록 마감일
                            </label>
                            <input
                                id="registration_deadline"
                                type="datetime-local"
                                value={formatDateForInput(formData.registration_deadline || '')}
                                onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
                                disabled={isLoading}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-match-blue focus:border-transparent ${errors.registration_deadline ? 'border-red-500' : ''
                                    }`}
                            />
                            {errors.registration_deadline && <p className="text-red-500 text-sm mt-1">{errors.registration_deadline}</p>}
                        </div>

                        <div>
                            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                                시작일
                            </label>
                            <input
                                id="start_date"
                                type="datetime-local"
                                value={formatDateForInput(formData.start_date || '')}
                                onChange={(e) => handleInputChange('start_date', e.target.value)}
                                disabled={isLoading}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-match-blue focus:border-transparent ${errors.start_date ? 'border-red-500' : ''
                                    }`}
                            />
                            {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
                        </div>

                        <div>
                            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                                종료일
                            </label>
                            <input
                                id="end_date"
                                type="datetime-local"
                                value={formatDateForInput(formData.end_date || '')}
                                onChange={(e) => handleInputChange('end_date', e.target.value)}
                                disabled={isLoading}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-match-blue focus:border-transparent ${errors.end_date ? 'border-red-500' : ''
                                    }`}
                            />
                            {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
                        </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            loading={isLoading}
                            className="flex-1"
                        >
                            {mode === 'create' ? '토너먼트 만들기' : '수정 완료'}
                        </Button>

                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                취소
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default TournamentForm; 