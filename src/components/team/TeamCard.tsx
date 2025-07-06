'use client';

import React from 'react';
import Link from 'next/link';
import { Team, Player } from '@/types';
import { Card } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface TeamCardProps {
    team: Team;
    players?: Player[];
    showTournament?: boolean;
    onClick?: () => void;
    className?: string;
}

export const TeamCard: React.FC<TeamCardProps> = ({
    team,
    players = [],
    showTournament = false,
    onClick,
    className = '',
}) => {
    const playerCount = players.length;
    const captainInfo = players.find(p => p.id === team.captain_id);
    
    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            e.preventDefault();
            onClick();
        }
    };
    
    const cardContent = (
        <Card className={`hover:shadow-lg transition-shadow duration-200 cursor-pointer ${className}`}>
            <div className="p-6">
                {/* 팀 헤더 */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        {/* 팀 로고 */}
                        {team.logo_url ? (
                            <img
                                src={team.logo_url}
                                alt={`${team.name} 로고`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-match-blue flex items-center justify-center text-white font-bold text-lg">
                                {team.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                                {team.name}
                            </h3>
                            {captainInfo && (
                                <p className="text-sm text-gray-600">
                                    주장: {captainInfo.name}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {/* 선수 수 */}
                    <div className="text-right">
                        <div className="text-sm text-gray-500">선수</div>
                        <div className="text-lg font-semibold text-match-blue">
                            {playerCount}명
                        </div>
                    </div>
                </div>
                
                {/* 팀 설명 */}
                {team.description && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                        {team.description}
                    </p>
                )}
                
                {/* 토너먼트 정보 (선택적) */}
                {showTournament && team.tournament && (
                    <div className="mb-4 p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">참가 토너먼트</div>
                        <div className="text-sm font-medium text-gray-900">
                            {team.tournament.title}
                        </div>
                    </div>
                )}
                
                {/* 선수 목록 미리보기 */}
                {playerCount > 0 && (
                    <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-2">선수 목록</div>
                        <div className="flex flex-wrap gap-1">
                            {players.slice(0, 3).map((player) => (
                                <span
                                    key={player.id}
                                    className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                >
                                    {player.name}
                                    {player.position && (
                                        <span className="text-gray-500 ml-1">
                                            ({player.position})
                                        </span>
                                    )}
                                </span>
                            ))}
                            {playerCount > 3 && (
                                <span className="inline-block px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                                    +{playerCount - 3}명
                                </span>
                            )}
                        </div>
                    </div>
                )}
                
                {/* 팀 정보 푸터 */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>생성일: {formatDate(team.created_at)}</span>
                    {team.updated_at !== team.created_at && (
                        <span>수정: {formatDate(team.updated_at)}</span>
                    )}
                </div>
            </div>
        </Card>
    );
    
    if (onClick) {
        return (
            <div onClick={handleClick}>
                {cardContent}
            </div>
        );
    }
    
    return (
        <Link href={`/teams/${team.id}`} className="block">
            {cardContent}
        </Link>
    );
};

export default TeamCard;