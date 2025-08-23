import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

// Supabase 클라이언트 생성
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET: 게임 점수 및 이벤트 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; gameId: string } }
) {
    try {
        const { id: matchId, gameId } = params;

        // 게임 정보 조회
        const { data: game, error: gameError } = await supabase
            .from('games')
            .select(`
                *,
                team1:teams!games_team1_id_fkey(id, name, logo_url),
                team2:teams!games_team2_id_fkey(id, name, logo_url)
            `)
            .eq('id', gameId)
            .eq('match_id', matchId)
            .single();

        if (gameError) {
            return NextResponse.json(
                { error: '게임을 찾을 수 없습니다' },
                { status: 404 }
            );
        }

        // 게임 이벤트 조회 (있다면)
        const { data: events } = await supabase
            .from('game_events')
            .select('*')
            .eq('game_id', gameId)
            .order('created_at', { ascending: false });

        return NextResponse.json({
            game,
            events: events || []
        });
    } catch (error) {
        console.error('Score fetch error:', error);
        return NextResponse.json(
            { error: '점수 조회 중 오류가 발생했습니다' },
            { status: 500 }
        );
    }
}

// POST: 점수 업데이트
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string; gameId: string } }
) {
    try {
        const { id: matchId, gameId } = params;
        const body = await request.json();
        const { team1_score, team2_score, status, winner_id } = body;

        // Authorization 헤더에서 토큰 추출
        const headersList = headers();
        const authorization = headersList.get('authorization');
        
        if (!authorization) {
            return NextResponse.json(
                { error: '인증이 필요합니다' },
                { status: 401 }
            );
        }

        const token = authorization.replace('Bearer ', '');
        
        // 사용자 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            return NextResponse.json(
                { error: '인증에 실패했습니다' },
                { status: 401 }
            );
        }

        // 경기 주최자 확인
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('creator_id')
            .eq('id', matchId)
            .single();

        if (matchError || !match) {
            return NextResponse.json(
                { error: '경기를 찾을 수 없습니다' },
                { status: 404 }
            );
        }

        if (match.creator_id !== user.id) {
            return NextResponse.json(
                { error: '경기 주최자만 점수를 입력할 수 있습니다' },
                { status: 403 }
            );
        }

        // 점수 업데이트
        const updateData: any = {
            team1_score,
            team2_score,
            updated_at: new Date().toISOString()
        };

        if (status) {
            updateData.status = status;
        }

        if (winner_id !== undefined) {
            updateData.winner_id = winner_id;
        }

        if (status === 'in_progress' && !updateData.started_at) {
            updateData.started_at = new Date().toISOString();
        }

        if (status === 'completed') {
            updateData.ended_at = new Date().toISOString();
        }

        const { data: updatedGame, error: updateError } = await supabase
            .from('games')
            .update(updateData)
            .eq('id', gameId)
            .eq('match_id', matchId)
            .select()
            .single();

        if (updateError) {
            console.error('Score update error:', updateError);
            return NextResponse.json(
                { error: '점수 업데이트에 실패했습니다' },
                { status: 500 }
            );
        }

        // 토너먼트 진행 (다음 라운드 생성 등)
        if (status === 'completed' && winner_id) {
            await progressTournament(matchId, gameId, winner_id);
        }

        return NextResponse.json({
            message: '점수가 업데이트되었습니다',
            game: updatedGame
        });
    } catch (error) {
        console.error('Score update error:', error);
        return NextResponse.json(
            { error: '점수 업데이트 중 오류가 발생했습니다' },
            { status: 500 }
        );
    }
}

// PATCH: 실시간 점수 이벤트 추가
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; gameId: string } }
) {
    try {
        const { gameId } = params;
        const body = await request.json();
        const { type, team, player_name, time, period, description } = body;

        // Authorization 확인
        const headersList = headers();
        const authorization = headersList.get('authorization');
        
        if (!authorization) {
            return NextResponse.json(
                { error: '인증이 필요합니다' },
                { status: 401 }
            );
        }

        const token = authorization.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            return NextResponse.json(
                { error: '인증에 실패했습니다' },
                { status: 401 }
            );
        }

        // 이벤트 생성
        const { data: event, error: eventError } = await supabase
            .from('game_events')
            .insert({
                game_id: gameId,
                type,
                team,
                player_name,
                time,
                period,
                description,
                created_by: user.id
            })
            .select()
            .single();

        if (eventError) {
            console.error('Event creation error:', eventError);
            return NextResponse.json(
                { error: '이벤트 생성에 실패했습니다' },
                { status: 500 }
            );
        }

        // 점수 관련 이벤트인 경우 자동으로 점수 업데이트
        if (['goal', 'penalty', 'own_goal'].includes(type)) {
            const { data: game } = await supabase
                .from('games')
                .select('team1_score, team2_score')
                .eq('id', gameId)
                .single();

            if (game) {
                let team1_score = game.team1_score || 0;
                let team2_score = game.team2_score || 0;

                if (type === 'own_goal') {
                    // 자책골은 상대팀 점수 증가
                    if (team === 'team1') {
                        team2_score++;
                    } else {
                        team1_score++;
                    }
                } else {
                    // 일반 골, 페널티
                    if (team === 'team1') {
                        team1_score++;
                    } else {
                        team2_score++;
                    }
                }

                await supabase
                    .from('games')
                    .update({ team1_score, team2_score })
                    .eq('id', gameId);
            }
        }

        return NextResponse.json({
            message: '이벤트가 추가되었습니다',
            event
        });
    } catch (error) {
        console.error('Event creation error:', error);
        return NextResponse.json(
            { error: '이벤트 추가 중 오류가 발생했습니다' },
            { status: 500 }
        );
    }
}

// 토너먼트 진행 함수
async function progressTournament(matchId: string, gameId: string, winnerId: string) {
    try {
        // 현재 게임 정보 조회
        const { data: game } = await supabase
            .from('games')
            .select('round, game_number')
            .eq('id', gameId)
            .single();

        if (!game) return;

        // 다음 라운드 게임 찾기 (토너먼트 구조에 따라)
        const nextRound = game.round + 1;
        const nextGameNumber = Math.floor(game.game_number / 2);

        // 다음 라운드 게임이 이미 있는지 확인
        const { data: nextGame } = await supabase
            .from('games')
            .select('id, team1_id, team2_id')
            .eq('match_id', matchId)
            .eq('round', nextRound)
            .eq('game_number', nextGameNumber)
            .single();

        if (nextGame) {
            // 승자를 다음 라운드에 배치
            const isUpperBracket = game.game_number % 2 === 0;
            const updateData = isUpperBracket
                ? { team1_id: winnerId }
                : { team2_id: winnerId };

            await supabase
                .from('games')
                .update(updateData)
                .eq('id', nextGame.id);
        }
    } catch (error) {
        console.error('Tournament progression error:', error);
        // 에러가 발생해도 점수 업데이트는 유지
    }
}