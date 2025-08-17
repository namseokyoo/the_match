'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterOption {
    label: string;
    value: string;
    count?: number;
}

export interface FilterGroup {
    id: string;
    label: string;
    type: 'single' | 'multiple';
    options: FilterOption[];
}

interface FilterPanelProps {
    groups: FilterGroup[];
    onApply: (filters: Record<string, string | string[]>) => void;
    onReset?: () => void;
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

export default function FilterPanel({
    groups,
    onApply,
    onReset,
    isOpen,
    onClose,
    className = ''
}: FilterPanelProps) {
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string | string[]>>({});
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // 초기화
    useEffect(() => {
        const initial: Record<string, string | string[]> = {};
        groups.forEach(group => {
            if (group.type === 'multiple') {
                initial[group.id] = [];
            } else {
                initial[group.id] = '';
            }
        });
        setSelectedFilters(initial);
        
        // 모든 그룹을 기본적으로 확장
        setExpandedGroups(new Set(groups.map(g => g.id)));
    }, [groups]);

    const toggleGroup = (groupId: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        } else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    };

    const handleOptionToggle = (groupId: string, value: string, type: 'single' | 'multiple') => {
        setSelectedFilters(prev => {
            const newFilters = { ...prev };
            
            if (type === 'single') {
                newFilters[groupId] = prev[groupId] === value ? '' : value;
            } else {
                const current = prev[groupId] as string[];
                if (current.includes(value)) {
                    newFilters[groupId] = current.filter(v => v !== value);
                } else {
                    newFilters[groupId] = [...current, value];
                }
            }
            
            return newFilters;
        });
    };

    const handleApply = () => {
        onApply(selectedFilters);
        onClose();
    };

    const handleReset = () => {
        const reset: Record<string, string | string[]> = {};
        groups.forEach(group => {
            reset[group.id] = group.type === 'multiple' ? [] : '';
        });
        setSelectedFilters(reset);
        if (onReset) onReset();
    };

    const getActiveFilterCount = () => {
        return Object.values(selectedFilters).reduce((count, value) => {
            if (Array.isArray(value)) {
                return count + value.length;
            }
            return count + (value ? 1 : 0);
        }, 0);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* 배경 오버레이 */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />
            
            {/* 필터 패널 */}
            <div className={`
                fixed right-0 top-0 h-full w-80 max-w-full bg-white shadow-2xl z-50
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                ${className}
            `}>
                {/* 헤더 */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-lg font-semibold">필터</h2>
                        {getActiveFilterCount() > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                                {getActiveFilterCount()}개 선택됨
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* 필터 그룹 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {groups.map(group => (
                        <div key={group.id} className="border-b pb-4 last:border-0">
                            <button
                                onClick={() => toggleGroup(group.id)}
                                className="flex items-center justify-between w-full text-left mb-3"
                            >
                                <h3 className="font-medium text-gray-900">{group.label}</h3>
                                {expandedGroups.has(group.id) ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                            </button>
                            
                            {expandedGroups.has(group.id) && (
                                <div className="space-y-2">
                                    {group.options.map(option => {
                                        const isSelected = group.type === 'single'
                                            ? selectedFilters[group.id] === option.value
                                            : (selectedFilters[group.id] as string[]).includes(option.value);
                                        
                                        return (
                                            <label
                                                key={option.value}
                                                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                            >
                                                <div className="flex items-center">
                                                    <input
                                                        type={group.type === 'single' ? 'radio' : 'checkbox'}
                                                        checked={isSelected}
                                                        onChange={() => handleOptionToggle(group.id, option.value, group.type)}
                                                        className="mr-3"
                                                    />
                                                    <span className="text-sm">{option.label}</span>
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
                        </div>
                    ))}
                </div>
                
                {/* 하단 버튼 */}
                <div className="p-4 border-t space-y-2">
                    <button
                        onClick={handleApply}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        필터 적용
                    </button>
                    <button
                        onClick={handleReset}
                        className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        초기화
                    </button>
                </div>
            </div>
        </>
    );
}

// 필터 칩 컴포넌트 (선택된 필터 표시용)
export function FilterChip({
    label,
    onRemove
}: {
    label: string;
    onRemove: () => void;
}) {
    return (
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            <span>{label}</span>
            <button
                onClick={onRemove}
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}