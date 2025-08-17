import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth, Permission } from '@/lib/auth/permissions';
import { withRateLimit } from '@/lib/rate-limiter';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; gameId: string }> }
) {
    try {
        const { id: matchId, gameId } = await params;
        const supabase = await createClient();
        
        const { data, error } = await supabase
            .from('games')
            .select(`
                *,
                team1:teams!games_team1_id_fkey(id, name, logo_url),
                team2:teams!games_team2_id_fkey(id, name, logo_url),
                winner:teams!games_winner_id_fkey(id, name)
            `)
            .eq('match_id', matchId)
            .eq('id', gameId)
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching game:', error);
        return NextResponse.json(
            { error: 'Failed to fetch game' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; gameId: string }> }
) {
    // Rate limiting 체크
    const rateLimitResponse = await withRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    // 권한 체크
    const authResponse = await withAuth(request, Permission.UPDATE_SCORE, {
        type: 'match',
        idParam: '3' // matches/[id]/games/[gameId]에서 [id]의 위치
    });
    if (authResponse) return authResponse;

    try {
        const { id: matchId, gameId } = await params;
        const body = await request.json();
        const { team1_score, team2_score, winner_id, status } = body;

        const supabase = await createClient();

        // 게임 정보 가져오기
        const { data: game, error: fetchError } = await supabase
            .from('games')
            .select('*, matches!inner(type)')
            .eq('id', gameId)
            .eq('match_id', matchId)
            .single();

        if (fetchError) throw fetchError;

        // 승자 결정 (제공되지 않은 경우)
        let winnerId = winner_id;
        if (!winnerId && team1_score !== undefined && team2_score !== undefined) {
            if (team1_score > team2_score) {
                winnerId = game.team1_id;
            } else if (team2_score > team1_score) {
                winnerId = game.team2_id;
            }
        }

        // 게임 결과 업데이트
        const { error: updateError } = await supabase
            .from('games')
            .update({
                team1_score,
                team2_score,
                winner_id: winnerId,
                status: status || 'completed',
                completed_at: status === 'completed' ? new Date().toISOString() : undefined
            })
            .eq('id', gameId);

        if (updateError) throw updateError;

        // 토너먼트인 경우 다음 라운드로 진출 처리
        if (game.matches.type === 'single_elimination' && game.next_game_id && winnerId) {
            const { data: nextGames } = await supabase
                .from('games')
                .select('*')
                .eq('match_id', matchId)
                .eq('round', game.round + 1);

            if (nextGames) {
                const nextGameIndex = parseInt(game.next_game_id);
                const nextGame = nextGames[nextGameIndex];

                if (nextGame) {
                    const isFirstTeam = game.game_number % 2 === 1;
                    await supabase
                        .from('games')
                        .update({
                            [isFirstTeam ? 'team1_id' : 'team2_id']: winnerId,
                        })
                        .eq('id', nextGame.id);
                }
            }
        }

        // 더블 엘리미네이션인 경우 패자를 Losers Bracket으로 이동
        if (game.matches.type === 'double_elimination' && winnerId) {
            const loserId = winnerId === game.team1_id ? game.team2_id : game.team1_id;
            
            if (game.venue?.includes('Winners Bracket')) {
                // Losers Bracket에서 적절한 게임 찾기
                const { data: losersGames } = await supabase
                    .from('games')
                    .select('*')
                    .eq('match_id', matchId)
                    .like('venue', '%Losers Bracket%')
                    .is('team1_id', null)
                    .order('round', { ascending: true })
                    .limit(1);

                if (losersGames && losersGames.length > 0) {
                    const targetGame = losersGames[0];
                    const updateField = !targetGame.team1_id ? 'team1_id' : 'team2_id';
                    
                    await supabase
                        .from('games')
                        .update({ [updateField]: loserId })
                        .eq('id', targetGame.id);
                }
            }
        }

        // 리그전인 경우 순위표 업데이트
        if (game.matches.type === 'round_robin') {
            await supabase.rpc('calculate_league_standings', {
                p_match_id: matchId,
            });
        }

        // 스위스 시스템인 경우 순위 재계산
        if (game.matches.type === 'swiss') {
            // Swiss 시스템 순위 업데이트 로직
            await supabase.rpc('calculate_swiss_standings', {
                p_match_id: matchId,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating game:', error);
        return NextResponse.json(
            { error: 'Failed to update game' },
            { status: 500 }
        );
    }
}