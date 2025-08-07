'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { CreateTemplateForm, MatchType } from '@/types';

export default function CreateTemplatePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateTemplateForm>({
        name: '',
        description: '',
        type: MatchType.SINGLE_ELIMINATION,
        sport_type: '',
        max_teams: undefined,
        min_teams: undefined,
        rules: {},
        settings: {},
        is_public: false,
        tags: [],
    });
    const [tagInput, setTagInput] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            alert('템플릿 이름을 입력해주세요.');
            return;
        }
        
        try {
            setLoading(true);
            
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            
            const data = await response.json();
            
            if (data.success) {
                router.push('/matches/templates');
            } else {
                alert(data.error || '템플릿 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Template creation error:', error);
            alert('템플릿 생성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...(formData.tags || []), tagInput.trim()],
            });
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData({
            ...formData,
            tags: formData.tags?.filter(t => t !== tag) || [],
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">새 템플릿 만들기</h1>
                    <p className="mt-2 text-gray-600">
                        자주 사용하는 경기 설정을 템플릿으로 저장하세요.
                    </p>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 기본 정보 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                템플릿 이름 *
                            </label>
                            <Input
                                type="text"
                                placeholder="예: 주말 농구 리그"
                                value={formData.name}
                                onChange={(value) => setFormData({ ...formData, name: value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                설명
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                placeholder="템플릿에 대한 설명을 입력하세요"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* 경기 설정 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                경기 형식 *
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as MatchType })}
                                required
                            >
                                <option value={MatchType.SINGLE_ELIMINATION}>싱글 엘리미네이션</option>
                                <option value={MatchType.DOUBLE_ELIMINATION}>더블 엘리미네이션</option>
                                <option value={MatchType.ROUND_ROBIN}>라운드 로빈</option>
                                <option value={MatchType.SWISS}>스위스 토너먼트</option>
                                <option value={MatchType.LEAGUE}>리그</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                종목
                            </label>
                            <Input
                                type="text"
                                placeholder="예: 농구, 축구, 배드민턴"
                                value={formData.sport_type || ''}
                                onChange={(value) => setFormData({ ...formData, sport_type: value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    최소 팀 수
                                </label>
                                <Input
                                    type="number"
                                    min="2"
                                    placeholder="2"
                                    value={formData.min_teams?.toString() || ''}
                                    onChange={(value) => setFormData({ 
                                        ...formData, 
                                        min_teams: value ? parseInt(value) : undefined 
                                    })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    최대 팀 수
                                </label>
                                <Input
                                    type="number"
                                    min="2"
                                    placeholder="32"
                                    value={formData.max_teams?.toString() || ''}
                                    onChange={(value) => setFormData({ 
                                        ...formData, 
                                        max_teams: value ? parseInt(value) : undefined 
                                    })}
                                />
                            </div>
                        </div>

                        {/* 태그 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                태그
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="태그 입력"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleAddTag}
                                >
                                    추가
                                </Button>
                            </div>
                            {formData.tags && formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                                        >
                                            #{tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-2 text-gray-500 hover:text-gray-700"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 공개 설정 */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="is_public"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={formData.is_public}
                                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                            />
                            <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                                다른 사용자들이 이 템플릿을 사용할 수 있도록 공개
                            </label>
                        </div>

                        {/* 버튼 */}
                        <div className="flex justify-end space-x-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={loading}
                                disabled={loading}
                            >
                                템플릿 생성
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}