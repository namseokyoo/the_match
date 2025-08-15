'use client';

import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';

interface FilterOption {
    value: string;
    label: string;
    count?: number;
}

interface FilterGroup {
    id: string;
    label: string;
    type: 'checkbox' | 'radio' | 'range' | 'date';
    options?: FilterOption[];
    min?: number;
    max?: number;
    value?: any;
}

interface AdvancedFilterProps {
    filterGroups: FilterGroup[];
    onApply: (filters: Record<string, any>) => void;
    onReset?: () => void;
    className?: string;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
    filterGroups,
    onApply,
    onReset,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState<Record<string, any>>({});
    // Note: filters variable used in handleApply function
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const handleFilterChange = (groupId: string, value: any) => {
        setFilters(prev => ({
            ...prev,
            [groupId]: value,
        }));
    };

    const handleApply = () => {
        onApply(filters);
        setIsOpen(false);
    };

    const handleReset = () => {
        setFilters({});
        onReset?.();
        setIsOpen(false);
    };

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const getActiveFilterCount = () => {
        return Object.values(filters).filter(value => {
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
            return value !== null && value !== undefined && value !== '';
        }).length;
    };

    const activeCount = getActiveFilterCount();

    return (
        <div className={`relative ${className}`}>
            {/* 필터 버튼 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">필터</span>
                {activeCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                        {activeCount}
                    </span>
                )}
            </button>

            {/* 필터 패널 */}
            {isOpen && (
                <>
                    {/* 오버레이 */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-25 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* 필터 드롭다운 */}
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                        {/* 헤더 */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">고급 필터</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 필터 그룹 */}
                        <div className="max-h-96 overflow-y-auto">
                            {filterGroups.map(group => (
                                <div key={group.id} className="border-b border-gray-100">
                                    {/* 그룹 헤더 */}
                                    <button
                                        onClick={() => toggleGroup(group.id)}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="text-sm font-medium text-gray-900">
                                            {group.label}
                                        </span>
                                        <ChevronDown
                                            className={`w-4 h-4 text-gray-400 transition-transform ${
                                                expandedGroups.has(group.id) ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>

                                    {/* 그룹 내용 */}
                                    {expandedGroups.has(group.id) && (
                                        <div className="px-4 pb-3">
                                            {group.type === 'checkbox' && group.options && (
                                                <div className="space-y-2">
                                                    {group.options.map(option => {
                                                        const isChecked = (filters[group.id] || []).includes(option.value);
                                                        return (
                                                            <label
                                                                key={option.value}
                                                                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                                                            >
                                                                <div className="flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={(e) => {
                                                                            const current = filters[group.id] || [];
                                                                            if (e.target.checked) {
                                                                                handleFilterChange(group.id, [...current, option.value]);
                                                                            } else {
                                                                                handleFilterChange(
                                                                                    group.id,
                                                                                    current.filter((v: string) => v !== option.value)
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                    <span className="text-sm text-gray-700">
                                                                        {option.label}
                                                                    </span>
                                                                </div>
                                                                {option.count !== undefined && (
                                                                    <span className="text-xs text-gray-500">
                                                                        ({option.count})
                                                                    </span>
                                                                )}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {group.type === 'radio' && group.options && (
                                                <div className="space-y-2">
                                                    {group.options.map(option => (
                                                        <label
                                                            key={option.value}
                                                            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                                                        >
                                                            <div className="flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name={group.id}
                                                                    checked={filters[group.id] === option.value}
                                                                    onChange={() => handleFilterChange(group.id, option.value)}
                                                                    className="mr-3 border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm text-gray-700">
                                                                    {option.label}
                                                                </span>
                                                            </div>
                                                            {option.count !== undefined && (
                                                                <span className="text-xs text-gray-500">
                                                                    ({option.count})
                                                                </span>
                                                            )}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {group.type === 'range' && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="number"
                                                            min={group.min}
                                                            max={group.max}
                                                            value={filters[group.id]?.min || group.min}
                                                            onChange={(e) => handleFilterChange(group.id, {
                                                                ...filters[group.id],
                                                                min: parseInt(e.target.value),
                                                            })}
                                                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-500">~</span>
                                                        <input
                                                            type="number"
                                                            min={group.min}
                                                            max={group.max}
                                                            value={filters[group.id]?.max || group.max}
                                                            onChange={(e) => handleFilterChange(group.id, {
                                                                ...filters[group.id],
                                                                max: parseInt(e.target.value),
                                                            })}
                                                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {group.type === 'date' && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="date"
                                                            value={filters[group.id]?.start || ''}
                                                            onChange={(e) => handleFilterChange(group.id, {
                                                                ...filters[group.id],
                                                                start: e.target.value,
                                                            })}
                                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-500">~</span>
                                                        <input
                                                            type="date"
                                                            value={filters[group.id]?.end || ''}
                                                            onChange={(e) => handleFilterChange(group.id, {
                                                                ...filters[group.id],
                                                                end: e.target.value,
                                                            })}
                                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 푸터 */}
                        <div className="flex items-center justify-between p-4 border-t border-gray-200">
                            <button
                                onClick={handleReset}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                초기화
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                적용하기
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// 경기 필터 프리셋
export const matchFilterGroups: FilterGroup[] = [
    {
        id: 'type',
        label: '경기 유형',
        type: 'checkbox',
        options: [
            { value: 'single_elimination', label: '싱글 엘리미네이션', count: 12 },
            { value: 'double_elimination', label: '더블 엘리미네이션', count: 8 },
            { value: 'round_robin', label: '라운드 로빈', count: 5 },
            { value: 'swiss', label: '스위스', count: 3 },
            { value: 'league', label: '리그', count: 15 },
        ],
    },
    {
        id: 'status',
        label: '경기 상태',
        type: 'checkbox',
        options: [
            { value: 'registration', label: '참가 신청 중', count: 20 },
            { value: 'in_progress', label: '진행 중', count: 10 },
            { value: 'completed', label: '완료', count: 45 },
            { value: 'cancelled', label: '취소됨', count: 2 },
        ],
    },
    {
        id: 'participants',
        label: '참가 팀 수',
        type: 'range',
        min: 2,
        max: 128,
    },
    {
        id: 'date',
        label: '경기 기간',
        type: 'date',
    },
];

export default AdvancedFilter;