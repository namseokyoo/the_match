import React from 'react';
import { Match, MatchType } from '@/types';
import { TournamentBracket } from '@/components/bracket/TournamentBracket';
import { Calendar, Trophy, Users, BarChart3, Grid3X3 } from 'lucide-react';

interface MatchVisualizationProps {
    match: Match;
    participants?: any[];
    games?: any[];
}

/**
 * 경기 방식에 따른 적절한 대진 시각화 컴포넌트를 렌더링
 */
export const MatchVisualization: React.FC<MatchVisualizationProps> = ({ 
    match, 
    participants = [], 
    games = [] 
}) => {
    // 토너먼트 방식 (Single/Double Elimination)
    if (match.type === MatchType.SINGLE_ELIMINATION || match.type === MatchType.DOUBLE_ELIMINATION) {
        return (
            <TournamentBracket 
                matchId={match.id}
                isOrganizer={false} // TODO: 실제 권한 체크 필요
            />
        );
    }

    // 리그전 (Round Robin)
    if (match.type === MatchType.ROUND_ROBIN) {
        return <RoundRobinTable match={match} participants={participants} games={games} />;
    }

    // 스위스 시스템
    if (match.type === MatchType.SWISS) {
        return <SwissSystemView match={match} participants={participants} games={games} />;
    }

    // 리그
    if (match.type === MatchType.LEAGUE) {
        return <LeagueStandings match={match} participants={participants} games={games} />;
    }

    // 기본 폴백
    return <DefaultMatchView match={match} participants={participants} games={games} />;
};

// 리그전 순위표 + 경기 일정
const RoundRobinTable: React.FC<{ match: Match; participants: any[]; games: any[] }> = ({ 
    match, 
    participants, 
    games 
}) => {
    // 순위 계산 로직
    const standings = calculateStandings(participants, games);
    
    return (
        <div className="space-y-4">
            {/* 순위표 */}
            <div className="bg-white rounded-lg border">
                <div className="p-3 border-b bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        순위표
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">순위</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">팀</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">경기</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">승</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">무</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">패</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">득실차</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">승점</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {standings.map((team, index) => (
                                <tr key={team.id} className={index < 3 ? 'bg-green-50' : ''}>
                                    <td className="px-3 py-2 text-sm font-semibold text-gray-900">{index + 1}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">{team.name}</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-600">{team.played}</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-600">{team.wins}</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-600">{team.draws}</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-600">{team.losses}</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-600">{team.goalDiff > 0 ? '+' : ''}{team.goalDiff}</td>
                                    <td className="px-3 py-2 text-sm text-center font-bold text-gray-900">{team.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 경기 매트릭스 */}
            <div className="bg-white rounded-lg border">
                <div className="p-3 border-b bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Grid3X3 className="w-4 h-4 text-blue-500" />
                        전체 경기 일정
                    </h3>
                </div>
                <div className="p-4">
                    <MatchMatrix participants={participants} games={games} />
                </div>
            </div>
        </div>
    );
};

// 스위스 시스템 뷰
const SwissSystemView: React.FC<{ match: Match; participants: any[]; games: any[] }> = ({ 
    match, 
    participants, 
    games 
}) => {
    // 라운드별 그룹화
    const roundsMap = groupByRound(games);
    const rounds = Array.from(roundsMap.entries()).sort(([a], [b]) => a - b);

    return (
        <div className="space-y-4">
            {rounds.map(([roundNumber, roundGames]) => (
                <div key={roundNumber} className="bg-white rounded-lg border">
                    <div className="p-3 border-b bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-900">
                            라운드 {roundNumber}
                        </h3>
                    </div>
                    <div className="p-3 space-y-2">
                        {roundGames.map((game: any) => (
                            <div key={game.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">{game.home_team?.name || 'TBD'}</span>
                                <span className="text-xs text-gray-500">vs</span>
                                <span className="text-sm">{game.away_team?.name || 'TBD'}</span>
                                {game.completed_at && (
                                    <span className="text-sm font-bold ml-2">
                                        {game.home_score} - {game.away_score}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// 리그 순위표
const LeagueStandings: React.FC<{ match: Match; participants: any[]; games: any[] }> = ({ 
    match, 
    participants, 
    games 
}) => {
    // 리그전과 유사하지만 시즌 개념 추가
    return <RoundRobinTable match={match} participants={participants} games={games} />;
};

// 기본 매치 뷰 (폴백)
const DefaultMatchView: React.FC<{ match: Match; participants: any[]; games: any[] }> = ({ 
    match, 
    participants, 
    games 
}) => {
    return (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
                {match.type} 방식의 대진 시각화는 아직 준비 중입니다.
            </p>
            <p className="text-sm text-gray-500 mt-2">
                경기 결과는 결과 탭에서 확인하실 수 있습니다.
            </p>
        </div>
    );
};

// 경기 매트릭스 컴포넌트
const MatchMatrix: React.FC<{ participants: any[]; games: any[] }> = ({ participants, games }) => {
    const getGameResult = (homeId: string, awayId: string) => {
        const game = games.find((g: any) => 
            g.home_team_id === homeId && g.away_team_id === awayId
        );
        if (!game) return '-';
        if (!game.completed_at) return 'vs';
        return `${game.home_score}-${game.away_score}`;
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr>
                        <th className="p-2 text-xs font-medium text-gray-500"></th>
                        {participants.map((p) => (
                            <th key={p.id} className="p-2 text-xs font-medium text-gray-500 text-center">
                                {p.team?.name?.substring(0, 3)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {participants.map((home) => (
                        <tr key={home.id}>
                            <td className="p-2 text-xs font-medium text-gray-900">
                                {home.team?.name}
                            </td>
                            {participants.map((away) => (
                                <td key={away.id} className="p-2 text-xs text-center border">
                                    {home.id === away.id ? (
                                        <span className="text-gray-300">-</span>
                                    ) : (
                                        <span className="font-medium">
                                            {getGameResult(home.team_id, away.team_id)}
                                        </span>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// 유틸리티 함수들
const calculateStandings = (participants: any[], games: any[]) => {
    const standings = participants.map((p) => ({
        id: p.id,
        name: p.team?.name || 'Unknown',
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0
    }));

    games.forEach((game: any) => {
        if (!game.completed_at) return;

        const homeTeam = standings.find(s => s.id === game.home_team_id);
        const awayTeam = standings.find(s => s.id === game.away_team_id);

        if (homeTeam && awayTeam) {
            homeTeam.played++;
            awayTeam.played++;
            homeTeam.goalsFor += game.home_score || 0;
            homeTeam.goalsAgainst += game.away_score || 0;
            awayTeam.goalsFor += game.away_score || 0;
            awayTeam.goalsAgainst += game.home_score || 0;

            if (game.home_score > game.away_score) {
                homeTeam.wins++;
                homeTeam.points += 3;
                awayTeam.losses++;
            } else if (game.away_score > game.home_score) {
                awayTeam.wins++;
                awayTeam.points += 3;
                homeTeam.losses++;
            } else {
                homeTeam.draws++;
                awayTeam.draws++;
                homeTeam.points += 1;
                awayTeam.points += 1;
            }
        }
    });

    standings.forEach(team => {
        team.goalDiff = team.goalsFor - team.goalsAgainst;
    });

    return standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return b.goalsFor - a.goalsFor;
    });
};

const groupByRound = (games: any[]) => {
    const rounds = new Map<number, any[]>();
    games.forEach((game) => {
        const round = game.round || 1;
        if (!rounds.has(round)) {
            rounds.set(round, []);
        }
        rounds.get(round)!.push(game);
    });
    return rounds;
};

export default MatchVisualization;