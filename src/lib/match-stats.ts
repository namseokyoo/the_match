import { supabase } from './supabase';
import { Match, Team } from '@/types';

// 경기 통계 계산
export async function getMatchStatistics(matchId: string) {
    try {
        // 참가팀 수 조회
        const { data: participants, error: participantsError } = await supabase
            .from('match_participants')
            .select('*')
            .eq('match_id', matchId)
            .eq('status', 'approved');

        if (participantsError) throw participantsError;

        // 경기 일정 조회
        const { data: games, error: gamesError } = await supabase
            .from('games')
            .select('*')
            .eq('match_id', matchId);

        if (gamesError) throw gamesError;

        const completedGames = games?.filter(g => g.status === 'completed') || [];
        const upcomingGames = games?.filter(g => g.status === 'upcoming' || g.status === 'scheduled') || [];
        const inProgressGames = games?.filter(g => g.status === 'in_progress') || [];

        return {
            totalTeams: participants?.length || 0,
            completedGames: completedGames.length,
            upcomingGames: upcomingGames.length,
            inProgressGames: inProgressGames.length,
            totalGames: games?.length || 0,
            winRate: completedGames.length > 0 
                ? Math.round((completedGames.filter(g => g.winner_id).length / completedGames.length) * 100)
                : 0
        };
    } catch (error) {
        console.error('Error fetching match statistics:', error);
        return {
            totalTeams: 0,
            completedGames: 0,
            upcomingGames: 0,
            inProgressGames: 0,
            totalGames: 0,
            winRate: 0
        };
    }
}

// 팀별 통계
export async function getTeamStatistics(matchId: string) {
    try {
        const { data: games, error } = await supabase
            .from('games')
            .select(`
                *,
                home_team:teams!games_home_team_id_fkey(id, name),
                away_team:teams!games_away_team_id_fkey(id, name)
            `)
            .eq('match_id', matchId)
            .eq('status', 'completed');

        if (error) throw error;

        // 팀별 승/패 집계
        const teamStats = new Map();

        games?.forEach(game => {
            if (game.winner_id) {
                const winnerId = game.winner_id;
                const loserId = game.winner_id === game.home_team_id ? game.away_team_id : game.home_team_id;

                // 승리 팀 통계
                if (!teamStats.has(winnerId)) {
                    teamStats.set(winnerId, { 
                        teamId: winnerId,
                        teamName: game.winner_id === game.home_team_id ? game.home_team?.name : game.away_team?.name,
                        wins: 0, 
                        losses: 0, 
                        points: 0,
                        goalsFor: 0,
                        goalsAgainst: 0
                    });
                }
                const winnerStats = teamStats.get(winnerId);
                winnerStats.wins++;
                winnerStats.points += 3;
                winnerStats.goalsFor += game.home_score || 0;
                winnerStats.goalsAgainst += game.away_score || 0;

                // 패배 팀 통계
                if (!teamStats.has(loserId)) {
                    teamStats.set(loserId, { 
                        teamId: loserId,
                        teamName: game.winner_id === game.home_team_id ? game.away_team?.name : game.home_team?.name,
                        wins: 0, 
                        losses: 0, 
                        points: 0,
                        goalsFor: 0,
                        goalsAgainst: 0
                    });
                }
                const loserStats = teamStats.get(loserId);
                loserStats.losses++;
                loserStats.goalsFor += game.away_score || 0;
                loserStats.goalsAgainst += game.home_score || 0;
            }
        });

        return Array.from(teamStats.values()).sort((a, b) => b.points - a.points);
    } catch (error) {
        console.error('Error fetching team statistics:', error);
        return [];
    }
}

// 최근 경기 결과
export async function getRecentResults(matchId: string, limit: number = 5) {
    try {
        const { data, error } = await supabase
            .from('games')
            .select(`
                *,
                home_team:teams!games_home_team_id_fkey(id, name, logo_url),
                away_team:teams!games_away_team_id_fkey(id, name, logo_url)
            `)
            .eq('match_id', matchId)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching recent results:', error);
        return [];
    }
}

// 다음 경기 일정
export async function getUpcomingGames(matchId: string, limit: number = 5) {
    try {
        const { data, error } = await supabase
            .from('games')
            .select(`
                *,
                home_team:teams!games_home_team_id_fkey(id, name, logo_url),
                away_team:teams!games_away_team_id_fkey(id, name, logo_url)
            `)
            .eq('match_id', matchId)
            .in('status', ['upcoming', 'scheduled'])
            .order('scheduled_at', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching upcoming games:', error);
        return [];
    }
}

// 선수별 통계 (Top Performers)
export async function getPlayerStatistics(matchId: string, limit: number = 10) {
    try {
        const { data, error } = await supabase
            .from('player_stats')
            .select(`
                *,
                player:players(id, name, position),
                team:teams(id, name)
            `)
            .eq('match_id', matchId)
            .order('goals', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching player statistics:', error);
        return [];
    }
}

// 경기 진행 상태 확인
export function getMatchProgress(match: Match) {
    const now = new Date();
    const startDate = match.start_date ? new Date(match.start_date) : null;
    const endDate = match.end_date ? new Date(match.end_date) : null;
    const registrationDeadline = match.registration_deadline ? new Date(match.registration_deadline) : null;

    if (!startDate) {
        return {
            status: 'not_scheduled',
            progress: 0,
            message: '경기 일정이 정해지지 않았습니다'
        };
    }

    if (now < startDate) {
        // 경기 시작 전
        if (registrationDeadline && now < registrationDeadline) {
            return {
                status: 'registration_open',
                progress: 0,
                message: '참가 신청 접수 중',
                daysUntilStart: Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            };
        }
        return {
            status: 'upcoming',
            progress: 0,
            message: '경기 시작 대기 중',
            daysUntilStart: Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        };
    }

    if (endDate && now > endDate) {
        return {
            status: 'completed',
            progress: 100,
            message: '경기 종료'
        };
    }

    // 경기 진행 중
    if (endDate) {
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = now.getTime() - startDate.getTime();
        const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
        
        return {
            status: 'in_progress',
            progress,
            message: `경기 진행 중 (${progress}%)`,
            daysRemaining: Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        };
    }

    return {
        status: 'in_progress',
        progress: 50,
        message: '경기 진행 중'
    };
}