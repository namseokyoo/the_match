'use client';

import React, { useState } from 'react';
import { Team, Player, PaginatedResponse } from '@/types';
import { TeamCard } from './TeamCard';
import { Button, Input } from '@/components/ui';

interface TeamListProps {
    teams: Team[];
    players?: Record<string, Player[]>; // team_id를 키로 하는 선수 목록
    pagination?: PaginatedResponse['pagination'];
    loading?: boolean;
    showTournament?: boolean;
    searchable?: boolean;
    onSearch?: (query: string) => void;
    onLoadMore?: () => void;
    onTeamClick?: (team: Team) => void;
    emptyMessage?: string;
    className?: string;
}

export const TeamList: React.FC<TeamListProps> = ({
    teams,
    players = {},
    pagination,
    loading = false,
    showTournament = false,
    searchable = true,
    onSearch,
    onLoadMore,
    onTeamClick,
    emptyMessage = '등록된 팀이 없습니다.',
    className = '',
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
    // 검색 핸들러
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        
        if (onSearch) {
            setIsSearching(true);
            try {
                await onSearch(query);
            } finally {
                setIsSearching(false);
            }
        }
    };
    
    // 검색 디바운싱
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        
        // 디바운싱을 위한 타이머
        const timeoutId = setTimeout(() => {
            handleSearch(value);
        }, 300);
        
        return () => clearTimeout(timeoutId);
    };
    
    // 더 보기 핸들러
    const handleLoadMore = async () => {
        if (onLoadMore && !loading) {
            await onLoadMore();
        }
    };
    
    // 팀 클릭 핸들러
    const handleTeamClick = (team: Team) => {
        if (onTeamClick) {
            onTeamClick(team);
        }
    };
    
    return (
        <div className={`space-y-6 ${className}`}>
            {/* 검색 바 */}
            {searchable && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="팀 이름으로 검색..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                disabled={loading || isSearching}
                                className="w-full"
                            />
                        </div>
                        {searchQuery && (
                            <Button
                                variant="outline"
                                size="md"
                                onClick={() => handleSearch('')}
                                disabled={loading || isSearching}
                            >
                                초기화
                            </Button>
                        )}
                    </div>
                    
                    {/* 검색 상태 표시 */}
                    {isSearching && (
                        <div className="mt-2 text-sm text-gray-500">
                            검색 중...
                        </div>
                    )}
                </div>
            )}
            
            {/* 팀 목록 */}
            <div className="space-y-4">
                {/* 로딩 상태 */}
                {loading && teams.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-match-blue"></div>
                        <span className="ml-2 text-gray-600">팀 목록을 불러오는 중...</span>
                    </div>
                )}
                
                {/* 빈 상태 */}
                {!loading && teams.length === 0 && (
                    <div className="text-center py-12">
                        <div className="mx-auto max-w-md">
                            <svg 
                                className="w-20 h-20 mx-auto text-gray-400 mb-4" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={1} 
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 3a2 2 0 11-4 0 2 2 0 014 0z" 
                                />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                팀이 없습니다
                            </h3>
                            <p className="text-gray-600">{emptyMessage}</p>
                        </div>
                    </div>
                )}
                
                {/* 팀 카드 그리드 */}
                {teams.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team) => (
                            <TeamCard
                                key={team.id}
                                team={team}
                                players={players[team.id] || []}
                                showTournament={showTournament}
                                onClick={onTeamClick ? () => handleTeamClick(team) : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>
            
            {/* 페이지네이션 */}
            {pagination && teams.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        {/* 페이지 정보 */}
                        <div className="text-sm text-gray-700">
                            <span className="font-medium">{pagination.total}</span>개 팀 중{' '}
                            <span className="font-medium">
                                {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}
                            </span>
                            -
                            <span className="font-medium">
                                {Math.min(pagination.page * pagination.limit, pagination.total)}
                            </span>
                            번째
                        </div>
                        
                        {/* 더 보기 버튼 */}
                        {pagination.hasNext && onLoadMore && (
                            <Button
                                variant="outline"
                                size="md"
                                onClick={handleLoadMore}
                                disabled={loading}
                                loading={loading}
                            >
                                더 보기
                            </Button>
                        )}
                    </div>
                    
                    {/* 페이지 정보 바 */}
                    <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-match-blue h-2 rounded-full transition-all duration-300"
                                style={{
                                    width: `${(pagination.page / pagination.totalPages) * 100}%`,
                                }}
                            />
                        </div>
                        <div className="mt-1 text-xs text-gray-500 text-center">
                            {pagination.page} / {pagination.totalPages} 페이지
                        </div>
                    </div>
                </div>
            )}
            
            {/* 로딩 상태 (추가 로드 시) */}
            {loading && teams.length > 0 && (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-match-blue"></div>
                    <span className="ml-2 text-gray-600 text-sm">추가 팀을 불러오는 중...</span>
                </div>
            )}
        </div>
    );
};

export default TeamList;