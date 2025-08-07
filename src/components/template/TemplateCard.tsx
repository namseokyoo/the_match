'use client';

import React from 'react';
import { Card, Button } from '@/components/ui';
import { MatchTemplate, MatchType } from '@/types';

interface TemplateCardProps {
    template: MatchTemplate;
    onUse?: (template: MatchTemplate) => void;
    onEdit?: (template: MatchTemplate) => void;
    onDelete?: (template: MatchTemplate) => void;
    isOwner?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
    template,
    onUse,
    onEdit,
    onDelete,
    isOwner = false,
}) => {
    const getTypeLabel = (type: MatchType) => {
        switch (type) {
            case MatchType.SINGLE_ELIMINATION:
                return '싱글 엘리미네이션';
            case MatchType.DOUBLE_ELIMINATION:
                return '더블 엘리미네이션';
            case MatchType.ROUND_ROBIN:
                return '라운드 로빈';
            case MatchType.SWISS:
                return '스위스 토너먼트';
            case MatchType.LEAGUE:
                return '리그';
            default:
                return type;
        }
    };

    return (
        <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {template.name}
                    </h3>
                    {template.description && (
                        <p className="text-sm text-gray-600 mb-2">
                            {template.description}
                        </p>
                    )}
                </div>
                {template.is_public && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        공개
                    </span>
                )}
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24">경기 형식:</span>
                    <span className="text-gray-900 font-medium">
                        {getTypeLabel(template.type)}
                    </span>
                </div>
                {template.sport_type && (
                    <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-24">종목:</span>
                        <span className="text-gray-900">{template.sport_type}</span>
                    </div>
                )}
                {template.max_teams && (
                    <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-24">최대 팀:</span>
                        <span className="text-gray-900">{template.max_teams}팀</span>
                    </div>
                )}
                <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24">사용 횟수:</span>
                    <span className="text-gray-900">{template.usage_count}회</span>
                </div>
            </div>

            {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.map((tag, index) => (
                        <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex gap-2">
                {onUse && (
                    <Button
                        onClick={() => onUse(template)}
                        variant="primary"
                        size="sm"
                        className="flex-1"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        이 템플릿 사용
                    </Button>
                )}
                {isOwner && (
                    <>
                        {onEdit && (
                            <Button
                                onClick={() => onEdit(template)}
                                variant="secondary"
                                size="sm"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                onClick={() => onDelete(template)}
                                variant="secondary"
                                size="sm"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </Button>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
};