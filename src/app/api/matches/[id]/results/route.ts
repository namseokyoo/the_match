import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { supabase } from '@/lib/supabase';

// 경기 결과 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        
        // 현재 사용자 확인
        const { data: { user } } = await supabase.auth.getUser();
        
        // 경기 정보 조회
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .eq('id', params.id)
            .single();
            
        if (matchError || !match) {
            return NextResponse.json(
                { error: '경기를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }
        
        // 경기 결과 조회 (matches 테이블의 results 필드)
        const results = match.results || [];
        
        return NextResponse.json({ 
            results,
            match_status: match.status,
            current_round: match.current_round
        });
    } catch (error) {
        console.error('Error fetching match results:', error);
        return NextResponse.json(
            { error: '경기 결과 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// 경기 결과 입력/수정
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        
        // 현재 사용자 확인
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }
        
        // 경기 정보 조회 및 권한 확인
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('*, creator_id')
            .eq('id', params.id)
            .single();
            
        if (matchError || !match) {
            return NextResponse.json(
                { error: '경기를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }
        
        // 경기 생성자만 결과 입력 가능
        if (match.creator_id !== user.id) {
            return NextResponse.json(
                { error: '경기 결과를 입력할 권한이 없습니다.' },
                { status: 403 }
            );
        }
        
        // 입력 데이터 검증
        const { game_id, team1_score, team2_score, round, match_index } = body;
        
        if (team1_score === undefined || team2_score === undefined) {
            return NextResponse.json(
                { error: '점수를 입력해주세요.' },
                { status: 400 }
            );
        }
        
        // 승자 결정
        let winner_id = null;
        if (team1_score > team2_score) {
            winner_id = body.team1_id;
        } else if (team2_score > team1_score) {
            winner_id = body.team2_id;
        }
        
        // 기존 결과 가져오기
        const currentResults = match.results || [];
        
        // 결과 업데이트 또는 추가
        const resultIndex = currentResults.findIndex(
            (r: any) => r.game_id === game_id || 
            (r.round === round && r.match_index === match_index)
        );
        
        const newResult = {
            game_id: game_id || `${params.id}_r${round}_m${match_index}`,
            round,
            match_index,
            team1_id: body.team1_id,
            team2_id: body.team2_id,
            team1_score,
            team2_score,
            winner_id,
            status: 'completed',
            completed_at: new Date().toISOString()
        };
        
        if (resultIndex !== -1) {
            currentResults[resultIndex] = newResult;
        } else {
            currentResults.push(newResult);
        }
        
        // 토너먼트 진행 상태 업데이트
        const updateData: any = {
            results: currentResults,
            updated_at: new Date().toISOString()
        };
        
        // 모든 경기가 완료되었는지 확인
        const totalMatches = match.total_matches || 0;
        const completedMatches = currentResults.filter((r: any) => r.status === 'completed').length;
        
        if (completedMatches === totalMatches && totalMatches > 0) {
            updateData.status = 'completed';
        } else if (completedMatches > 0 && match.status === 'registration') {
            updateData.status = 'in_progress';
        }
        
        // 현재 라운드 업데이트
        if (round !== undefined && round > (match.current_round || 0)) {
            updateData.current_round = round;
        }
        
        // 데이터베이스 업데이트
        const { data: updatedMatch, error: updateError } = await supabase
            .from('matches')
            .update(updateData)
            .eq('id', params.id)
            .select()
            .single();
            
        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json(
                { error: '경기 결과 저장 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }
        
        // 다음 라운드 진출 처리 (토너먼트인 경우)
        if (match.match_type === 'single_elimination' && winner_id) {
            await processNextRound(supabase, params.id, round, match_index, winner_id);
        }
        
        return NextResponse.json({
            message: '경기 결과가 저장되었습니다.',
            result: newResult,
            match: updatedMatch
        });
        
    } catch (error) {
        console.error('Error saving match result:', error);
        return NextResponse.json(
            { error: '경기 결과 저장 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// 다음 라운드 진출 처리
async function processNextRound(
    supabase: any,
    matchId: string,
    currentRound: number,
    matchIndex: number,
    winnerId: string
) {
    try {
        // 다음 라운드 정보 계산
        const nextRound = currentRound + 1;
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const isFirstTeam = matchIndex % 2 === 0;
        
        // 브래킷 정보 업데이트 (추후 구현)
        // 여기서는 승자를 다음 라운드에 배치하는 로직을 구현
        console.log(`Advancing team ${winnerId} to round ${nextRound}, match ${nextMatchIndex}`);
        
    } catch (error) {
        console.error('Error processing next round:', error);
    }
}

// 경기 결과 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const gameId = searchParams.get('game_id');
        
        if (!gameId) {
            return NextResponse.json(
                { error: 'game_id가 필요합니다.' },
                { status: 400 }
            );
        }
        
        // 현재 사용자 확인
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }
        
        // 경기 정보 조회 및 권한 확인
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('*, creator_id')
            .eq('id', params.id)
            .single();
            
        if (matchError || !match) {
            return NextResponse.json(
                { error: '경기를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }
        
        // 경기 생성자만 결과 삭제 가능
        if (match.creator_id !== user.id) {
            return NextResponse.json(
                { error: '경기 결과를 삭제할 권한이 없습니다.' },
                { status: 403 }
            );
        }
        
        // 기존 결과에서 해당 게임 결과 제거
        const currentResults = match.results || [];
        const updatedResults = currentResults.filter((r: any) => r.game_id !== gameId);
        
        // 데이터베이스 업데이트
        const { error: updateError } = await supabase
            .from('matches')
            .update({ 
                results: updatedResults,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id);
            
        if (updateError) {
            console.error('Delete error:', updateError);
            return NextResponse.json(
                { error: '경기 결과 삭제 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }
        
        return NextResponse.json({
            message: '경기 결과가 삭제되었습니다.'
        });
        
    } catch (error) {
        console.error('Error deleting match result:', error);
        return NextResponse.json(
            { error: '경기 결과 삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}