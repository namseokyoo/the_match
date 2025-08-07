'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TemplateCard } from '@/components/template/TemplateCard';
import { Card, Button } from '@/components/ui';
import { MatchTemplate } from '@/types';
import { useAuth } from '@/hooks/useAuth';

type FilterType = 'all' | 'mine' | 'public';

export default function TemplatesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [templates, setTemplates] = useState<MatchTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');

    useEffect(() => {
        fetchTemplates();
    }, [filter]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/templates?filter=${filter}`);
            const data = await response.json();
            
            if (data.success) {
                setTemplates(data.data || []);
            }
        } catch (error) {
            console.error('Templates fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUseTemplate = async (template: MatchTemplate) => {
        // 사용 횟수 증가
        await fetch(`/api/templates/${template.id}`, { method: 'POST' });
        
        // 경기 생성 페이지로 이동하면서 템플릿 데이터 전달
        router.push(`/matches/create?templateId=${template.id}`);
    };

    const handleEditTemplate = (template: MatchTemplate) => {
        router.push(`/matches/templates/${template.id}/edit`);
    };

    const handleDeleteTemplate = async (template: MatchTemplate) => {
        if (!confirm('정말 이 템플릿을 삭제하시겠습니까?')) return;
        
        try {
            const response = await fetch(`/api/templates/${template.id}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                await fetchTemplates();
            }
        } catch (error) {
            console.error('Template delete error:', error);
            alert('템플릿 삭제에 실패했습니다.');
        }
    };

    if (loading) {
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">경기 템플릿</h1>
                            <p className="mt-2 text-gray-600">
                                자주 사용하는 경기 설정을 템플릿으로 저장하고 재사용하세요.
                            </p>
                        </div>
                        <Link href="/matches/templates/create">
                            <Button variant="primary">
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                새 템플릿 만들기
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 필터 탭 */}
                <div className="mb-6">
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setFilter('all')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                                filter === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            모든 템플릿
                        </button>
                        <button
                            onClick={() => setFilter('public')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                                filter === 'public'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            공개 템플릿
                        </button>
                        {user && (
                            <button
                                onClick={() => setFilter('mine')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                                    filter === 'mine'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                내 템플릿
                            </button>
                        )}
                    </div>
                </div>

                {/* 템플릿 목록 */}
                {templates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(template => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                onUse={handleUseTemplate}
                                onEdit={handleEditTemplate}
                                onDelete={handleDeleteTemplate}
                                isOwner={user?.id === template.creator_id}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="p-12 text-center">
                        <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {filter === 'mine' ? '아직 생성한 템플릿이 없습니다.' : '템플릿이 없습니다.'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            자주 사용하는 경기 설정을 템플릿으로 저장해보세요.
                        </p>
                        <Link href="/matches/templates/create">
                            <Button variant="primary">
                                첫 템플릿 만들기
                            </Button>
                        </Link>
                    </Card>
                )}
            </div>
        </div>
    );
}