'use client';

import React, { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { MatchType, MatchStatus } from '@/types';

interface FilterOptions {
    type?: MatchType[];
    status?: MatchStatus[];
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'created_at' | 'start_date' | 'title';
    sortOrder?: 'asc' | 'desc';
}

interface FilterPanelProps {
    filters: FilterOptions;
    onFilterChange: (filters: FilterOptions) => void;
    filterType: 'matches' | 'teams' | 'players';
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
    filters: _filters,
    onFilterChange,
    filterType,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [localFilters, setLocalFilters] = useState<FilterOptions>(_filters);

    const handleTypeToggle = (type: MatchType) => {
        const currentTypes = localFilters.type || [];
        const newTypes = currentTypes.includes(type)
            ? currentTypes.filter(t => t !== type)
            : [...currentTypes, type];
        
        setLocalFilters({ ...localFilters, type: newTypes });
    };

    const handleStatusToggle = (status: MatchStatus) => {
        const currentStatuses = localFilters.status || [];
        const newStatuses = currentStatuses.includes(status)
            ? currentStatuses.filter(s => s !== status)
            : [...currentStatuses, status];
        
        setLocalFilters({ ...localFilters, status: newStatuses });
    };

    const handleApplyFilters = () => {
        onFilterChange(localFilters);
    };

    const handleResetFilters = () => {
        const resetFilters: FilterOptions = {
            sortBy: 'created_at',
            sortOrder: 'desc',
        };
        setLocalFilters(resetFilters);
        onFilterChange(resetFilters);
    };

    const hasActiveFilters = () => {
        return (localFilters.type && localFilters.type.length > 0) ||
               (localFilters.status && localFilters.status.length > 0) ||
               localFilters.dateFrom ||
               localFilters.dateTo;
    };

    if (filterType === 'matches') {
        return (
            <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-medium text-gray-900">필터</h3>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <svg 
                            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {isExpanded && (
                    <div className="space-y-4">
                        {/* 경기 타입 필터 */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">경기 타입</h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(MatchType).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleTypeToggle(type)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            localFilters.type?.includes(type)
                                                ? 'bg-primary-500 text-white shadow-sm'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                    >
                                        {type.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 경기 상태 필터 */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">경기 상태</h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(MatchStatus).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusToggle(status)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            localFilters.status?.includes(status)
                                                ? 'bg-primary-500 text-white shadow-sm'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                    >
                                        {status === MatchStatus.DRAFT && '초안'}
                                        {status === MatchStatus.REGISTRATION && '등록 중'}
                                        {status === MatchStatus.IN_PROGRESS && '진행 중'}
                                        {status === MatchStatus.COMPLETED && '완료'}
                                        {status === MatchStatus.CANCELLED && '취소됨'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 날짜 범위 필터 */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">날짜 범위</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-600">시작일</label>
                                    <input
                                        type="date"
                                        value={localFilters.dateFrom || ''}
                                        onChange={(e) => setLocalFilters({ ...localFilters, dateFrom: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">종료일</label>
                                    <input
                                        type="date"
                                        value={localFilters.dateTo || ''}
                                        onChange={(e) => setLocalFilters({ ...localFilters, dateTo: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 정렬 옵션 */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">정렬</h4>
                            <div className="flex space-x-2">
                                <select
                                    value={localFilters.sortBy || 'created_at'}
                                    onChange={(e) => setLocalFilters({ ...localFilters, sortBy: e.target.value as any })}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                                >
                                    <option value="created_at">생성일</option>
                                    <option value="start_date">시작일</option>
                                    <option value="title">제목</option>
                                </select>
                                <select
                                    value={localFilters.sortOrder || 'desc'}
                                    onChange={(e) => setLocalFilters({ ...localFilters, sortOrder: e.target.value as 'asc' | 'desc' })}
                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                                >
                                    <option value="desc">내림차순</option>
                                    <option value="asc">오름차순</option>
                                </select>
                            </div>
                        </div>

                        {/* 필터 액션 버튼 */}
                        <div className="flex space-x-2 pt-2">
                            <Button
                                onClick={handleApplyFilters}
                                variant="primary"
                                size="sm"
                                className="flex-1"
                            >
                                필터 적용
                            </Button>
                            {hasActiveFilters() && (
                                <Button
                                    onClick={handleResetFilters}
                                    variant="secondary"
                                    size="sm"
                                >
                                    초기화
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* 활성 필터 표시 */}
                {hasActiveFilters() && !isExpanded && (
                    <div className="mt-2">
                        <p className="text-sm text-gray-600">
                            {localFilters.type && localFilters.type.length > 0 && (
                                <span className="mr-2">타입: {localFilters.type.length}개</span>
                            )}
                            {localFilters.status && localFilters.status.length > 0 && (
                                <span className="mr-2">상태: {localFilters.status.length}개</span>
                            )}
                            {(localFilters.dateFrom || localFilters.dateTo) && (
                                <span>날짜 필터 적용</span>
                            )}
                        </p>
                    </div>
                )}
            </Card>
        );
    }

    // 팀/선수 필터는 추후 구현
    return (
        <Card className="p-4">
            <p className="text-gray-600">필터 준비 중...</p>
        </Card>
    );
};