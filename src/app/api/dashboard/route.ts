import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// GET /api/dashboard - 대시보드 데이터 한 번에 가져오기 (N+1 쿼리 방지)
export async function GET() {
    try {
        console.log('Dashboard API called');
        
        const supabaseAdmin = getSupabaseAdmin();
        
        // 병렬로 모든 데이터 가져오기 - 성능 최적화
        const [
            { data: matches, error: matchesError },
            { data: teams, error: teamsError },
            { count: matchCount, error: matchCountError },
            { count: teamCount, error: teamCountError },
            { count: playerCount, error: playerCountError }
        ] = await Promise.all([
            // 1. 경기 데이터 - 제한된 필드만 가져와서 성능 향상
            supabaseAdmin
                .from('matches')
                .select('id, title, type, status, start_date, end_date, registration_deadline, max_participants, created_at')
                .order('created_at', { ascending: false })
                .limit(50), // 충분한 데이터 확보하되 제한

            // 2. 팀 데이터 - 필요한 필드만 선택
            supabaseAdmin
                .from('teams')
                .select('id, name, description, captain_id, match_id, created_at')
                .order('created_at', { ascending: false })
                .limit(20),

            // 3. 통계 데이터 - 개별 count 쿼리
            supabaseAdmin
                .from('matches')
                .select('id', { count: 'exact', head: true }),
            
            supabaseAdmin
                .from('teams')
                .select('id', { count: 'exact', head: true }),
            
            supabaseAdmin
                .from('players')
                .select('id', { count: 'exact', head: true })
        ]);

        if (matchesError) {
            console.error('Matches fetch error:', matchesError);
        }
        
        if (teamsError) {
            console.error('Teams fetch error:', teamsError);
        }
        
        if (matchCountError || teamCountError || playerCountError) {
            console.warn('Stats fetch errors:', { matchCountError, teamCountError, playerCountError });
        }

        // 데이터 처리 및 분류
        const now = new Date();
        
        // 활성 경기들 (진행 중 + 등록 중)
        const activeMatches = (matches || [])
            .filter(match => 
                match.status === 'in_progress' || 
                match.status === 'registration'
            )
            .slice(0, 6);

        // 곧 시작될 경기들
        const upcomingMatches = (matches || [])
            .filter(match => {
                if (match.status !== 'registration' && match.status !== 'draft') {
                    return false;
                }
                
                if (!match.start_date) {
                    return false;
                }
                
                try {
                    const startDate = new Date(match.start_date as string);
                    return !isNaN(startDate.getTime()) && startDate >= now;
                } catch {
                    return false;
                }
            })
            .sort((a, b) => {
                const dateA = a.start_date ? new Date(a.start_date as string).getTime() : 0;
                const dateB = b.start_date ? new Date(b.start_date as string).getTime() : 0;
                return dateA - dateB;
            })
            .slice(0, 4);

        // 팀원 모집 중인 팀들
        const recruitingTeams = (teams || [])
            .filter(team => team.captain_id !== null)
            .slice(0, 4);

        // 통계 데이터 정리
        const dashboardStats = {
            total_matches: matchCount || 0,
            total_teams: teamCount || 0,
            total_players: playerCount || 0
        };

        console.log('Dashboard data processed successfully:', {
            activeMatches: activeMatches.length,
            upcomingMatches: upcomingMatches.length,
            recruitingTeams: recruitingTeams.length,
            totalMatches: dashboardStats.total_matches
        });

        const response = NextResponse.json({
            success: true,
            data: {
                activeMatches,
                upcomingMatches,
                recruitingTeams,
                stats: {
                    totalMatches: dashboardStats.total_matches,
                    totalTeams: dashboardStats.total_teams,
                    totalPlayers: dashboardStats.total_players
                }
            },
            cached: false,
            timestamp: new Date().toISOString()
        });

        // HTTP 캐시 헤더 추가 - 30초간 캐시, 최대 1분간 stale 허용
        response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
        response.headers.set('CDN-Cache-Control', 'public, s-maxage=30');
        
        return response;
        
    } catch (error) {
        console.error('Dashboard API error:', error);
        
        // 에러 시에도 최소한의 데이터 구조 반환
        return NextResponse.json({
            success: false,
            data: {
                activeMatches: [],
                upcomingMatches: [],
                recruitingTeams: [],
                stats: {
                    totalMatches: 0,
                    totalTeams: 0,
                    totalPlayers: 0
                }
            },
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}