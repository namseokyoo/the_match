import React from 'react';
import Link from 'next/link';
import { Team } from '@/types';
import { Users, Trophy, Calendar, MapPin, ChevronRight } from 'lucide-react';

interface CompactTeamCardProps {
    team: Team;
    onView?: (teamId: string) => void;
}

// 팀 스포츠 아이콘 - 팀 이름에서 유추 또는 기본 아이콘 사용
const getSportIcon = (teamName: string): string => {
    const name = teamName.toLowerCase();
    if (name.includes('축구') || name.includes('fc')) return '⚽';
    if (name.includes('농구')) return '🏀';
    if (name.includes('야구')) return '⚾';
    if (name.includes('배구')) return '🏐';
    if (name.includes('테니스')) return '🎾';
    if (name.includes('배드민턴')) return '🏸';
    if (name.includes('탁구')) return '🏓';
    if (name.includes('골프')) return '⛳';
    if (name.includes('볼링')) return '🎳';
    if (name.includes('e스포츠') || name.includes('게임')) return '🎮';
    return '🏆';
};

export const CompactTeamCard: React.FC<CompactTeamCardProps> = ({ team, onView }) => {
    const sportIcon = getSportIcon(team.name);
    const memberCount = team.current_members || 0;
    const maxMembers = team.recruitment_count || 30;
    const memberPercentage = maxMembers > 0 ? (memberCount / maxMembers) * 100 : 0;
    
    // 팀 활동 상태 - 모든 팀은 기본적으로 활성 상태로 간주
    const isActive = true;
    const statusColor = 'border-l-4 border-green-500 bg-green-50';
    
    return (
        <div 
            className={`
                bg-white rounded-lg p-3 hover:shadow-md transition-all cursor-pointer
                ${statusColor}
            `}
            onClick={() => onView?.(team.id)}
            data-testid="compact-team-card"
        >
            <div className="flex justify-between items-start gap-3">
                {/* 왼쪽: 핵심 정보 */}
                <div className="flex-1 min-w-0">
                    {/* 제목과 상태 */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{sportIcon}</span>
                        <h3 className="font-semibold text-sm text-gray-900 truncate flex-1">
                            {team.name}
                        </h3>
                        {/* 위치 정보 또는 창단일 */}
                        {team.created_at && (
                            <span className="text-xs text-gray-500">
                                {new Date(team.created_at).getFullYear()}년
                            </span>
                        )}
                    </div>
                    
                    {/* 정보 라인 */}
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{memberCount}/{maxMembers || '∞'}</span>
                        </div>
                        {/* 설명이 있을 경우 첫 줄만 표시 */}
                        {team.description && (
                            <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                {team.description}
                            </div>
                        )}
                        {team.created_at && (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(team.created_at).getFullYear()}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* 멤버 진행률 바 (선택적) */}
                    {maxMembers > 0 && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                                className={`h-1.5 rounded-full transition-all ${
                                    memberPercentage >= 100 ? 'bg-red-500' :
                                    memberPercentage >= 80 ? 'bg-orange-500' :
                                    'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(memberPercentage, 100)}%` }}
                            />
                        </div>
                    )}
                    
                    {/* 모집/참가 현황 표시 */}
                    {team.recruitment_count && team.recruitment_count > 0 && (
                        <div className="mt-1.5 text-xs text-gray-600">
                            현재 모집 중 ({memberCount}/{maxMembers}명)
                        </div>
                    )}
                </div>
                
                {/* 오른쪽: 액션 */}
                <div className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
            </div>
        </div>
    );
};

export default CompactTeamCard;