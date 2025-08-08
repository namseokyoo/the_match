import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST() {
    try {
        const supabase = getSupabaseAdmin();
        
        // 1. 추가 팀 생성
        const additionalTeams = [
            { id: 'a4444444-4444-4444-4444-444444444444', name: '대전 파이터스 FC', logo_url: 'https://placehold.co/200x200/FF9F43/FFFFFF?text=Fighters', description: '대전 지역 축구 동호회. 열정 가득!' },
            { id: 'a5555555-5555-5555-5555-555555555555', name: '광주 샤이너스 FC', logo_url: 'https://placehold.co/200x200/32C1CD/FFFFFF?text=Shiners', description: '광주 축구팀. 주말리그 우승 경력' },
            { id: 'a6666666-6666-6666-6666-666666666666', name: '울산 타이거스', logo_url: 'https://placehold.co/200x200/FFA502/333333?text=Tigers', description: '울산 직장인 축구팀' },
            { id: 'a7777777-7777-7777-7777-777777777777', name: '수원 블루윙스', logo_url: 'https://placehold.co/200x200/0984E3/FFFFFF?text=Bluewings', description: '수원 아마추어 축구팀' },
            { id: 'a8888888-8888-8888-8888-888888888888', name: '성남 FC 유나이티드', logo_url: 'https://placehold.co/200x200/6C5CE7/FFFFFF?text=Seongnam', description: '성남 지역 강호' },
            { id: 'b4444444-4444-4444-4444-444444444444', name: '동대문 레이커스', logo_url: 'https://placehold.co/200x200/8E44AD/FFFFFF?text=Lakers', description: '동대문 농구 동호회' },
            { id: 'b5555555-5555-5555-5555-555555555555', name: '노원 워리어스', logo_url: 'https://placehold.co/200x200/E74C3C/FFFFFF?text=Warriors', description: '노원구 농구팀' },
            { id: 'b6666666-6666-6666-6666-666666666666', name: '중랑 불스', logo_url: 'https://placehold.co/200x200/C0392B/FFFFFF?text=Bulls', description: '중랑구 3x3 농구팀' },
            { id: 'c3333333-3333-3333-3333-333333333333', name: '강동 세터스', logo_url: 'https://placehold.co/200x200/27AE60/FFFFFF?text=Setters', description: '강동구 배구 동호회' },
            { id: 'c4444444-4444-4444-4444-444444444444', name: '관악 블로커스', logo_url: 'https://placehold.co/200x200/16A085/FFFFFF?text=Blockers', description: '관악구 혼성 배구팀' }
        ];

        const { error: teamsError } = await supabase
            .from('teams')
            .upsert(additionalTeams, { onConflict: 'id' });

        if (teamsError) {
            console.error('Teams insert error:', teamsError);
        }

        // 2. 경기 참가 신청 데이터
        const participants = [
            // 2024 서울 챔피언십 (8팀 토너먼트)
            { match_id: 'm1111111-1111-1111-1111-111111111111', team_id: 'a1111111-1111-1111-1111-111111111111', status: 'approved' },
            { match_id: 'm1111111-1111-1111-1111-111111111111', team_id: 'a2222222-2222-2222-2222-222222222222', status: 'approved' },
            { match_id: 'm1111111-1111-1111-1111-111111111111', team_id: 'a3333333-3333-3333-3333-333333333333', status: 'approved' },
            { match_id: 'm1111111-1111-1111-1111-111111111111', team_id: 'a4444444-4444-4444-4444-444444444444', status: 'approved' },
            { match_id: 'm1111111-1111-1111-1111-111111111111', team_id: 'a5555555-5555-5555-5555-555555555555', status: 'approved' },
            { match_id: 'm1111111-1111-1111-1111-111111111111', team_id: 'a6666666-6666-6666-6666-666666666666', status: 'approved' },
            { match_id: 'm1111111-1111-1111-1111-111111111111', team_id: 'a7777777-7777-7777-7777-777777777777', status: 'approved' },
            { match_id: 'm1111111-1111-1111-1111-111111111111', team_id: 'a8888888-8888-8888-8888-888888888888', status: 'approved' },
            
            // 여름 리그전 (6팀)
            { match_id: 'm2222222-2222-2222-2222-222222222222', team_id: 'a1111111-1111-1111-1111-111111111111', status: 'approved' },
            { match_id: 'm2222222-2222-2222-2222-222222222222', team_id: 'a2222222-2222-2222-2222-222222222222', status: 'approved' },
            { match_id: 'm2222222-2222-2222-2222-222222222222', team_id: 'a3333333-3333-3333-3333-333333333333', status: 'approved' },
            { match_id: 'm2222222-2222-2222-2222-222222222222', team_id: 'a4444444-4444-4444-4444-444444444444', status: 'approved' },
            { match_id: 'm2222222-2222-2222-2222-222222222222', team_id: 'a5555555-5555-5555-5555-555555555555', status: 'approved' },
            { match_id: 'm2222222-2222-2222-2222-222222222222', team_id: 'a6666666-6666-6666-6666-666666666666', status: 'pending' },
            
            // 강남구 농구 대회 (4팀)
            { match_id: 'm3333333-3333-3333-3333-333333333333', team_id: 'b1111111-1111-1111-1111-111111111111', status: 'approved' },
            { match_id: 'm3333333-3333-3333-3333-333333333333', team_id: 'b2222222-2222-2222-2222-222222222222', status: 'approved' },
            { match_id: 'm3333333-3333-3333-3333-333333333333', team_id: 'b3333333-3333-3333-3333-333333333333', status: 'approved' },
            { match_id: 'm3333333-3333-3333-3333-333333333333', team_id: 'b4444444-4444-4444-4444-444444444444', status: 'approved' },
            
            // 전국 배구 토너먼트
            { match_id: 'm4444444-4444-4444-4444-444444444444', team_id: 'c1111111-1111-1111-1111-111111111111', status: 'approved' },
            { match_id: 'm4444444-4444-4444-4444-444444444444', team_id: 'c2222222-2222-2222-2222-222222222222', status: 'approved' },
            { match_id: 'm4444444-4444-4444-4444-444444444444', team_id: 'c3333333-3333-3333-3333-333333333333', status: 'approved' },
            { match_id: 'm4444444-4444-4444-4444-444444444444', team_id: 'c4444444-4444-4444-4444-444444444444', status: 'pending' },
            
            // 가을 축구 리그 (신청 대기중)
            { match_id: 'm5555555-5555-5555-5555-555555555555', team_id: 'a1111111-1111-1111-1111-111111111111', status: 'pending' },
            { match_id: 'm5555555-5555-5555-5555-555555555555', team_id: 'a2222222-2222-2222-2222-222222222222', status: 'pending' },
            { match_id: 'm5555555-5555-5555-5555-555555555555', team_id: 'a3333333-3333-3333-3333-333333333333', status: 'approved' },
            { match_id: 'm5555555-5555-5555-5555-555555555555', team_id: 'a4444444-4444-4444-4444-444444444444', status: 'rejected' }
        ];

        const { error: participantsError } = await supabase
            .from('match_participants')
            .upsert(participants, { onConflict: 'match_id,team_id' });

        if (participantsError) {
            console.error('Participants insert error:', participantsError);
        }

        // 3. 토너먼트 대진표 (bracket_nodes) - 2024 서울 챔피언십
        const bracketNodes = [
            // 8강
            { id: 'bn111111-1111-1111-1111-111111111111', match_id: 'm1111111-1111-1111-1111-111111111111', round: 1, position: 1, team_id: 'a1111111-1111-1111-1111-111111111111' },
            { id: 'bn111111-2222-2222-2222-222222222222', match_id: 'm1111111-1111-1111-1111-111111111111', round: 1, position: 2, team_id: 'a2222222-2222-2222-2222-222222222222' },
            { id: 'bn111111-3333-3333-3333-333333333333', match_id: 'm1111111-1111-1111-1111-111111111111', round: 1, position: 3, team_id: 'a3333333-3333-3333-3333-333333333333' },
            { id: 'bn111111-4444-4444-4444-444444444444', match_id: 'm1111111-1111-1111-1111-111111111111', round: 1, position: 4, team_id: 'a4444444-4444-4444-4444-444444444444' },
            { id: 'bn111111-5555-5555-5555-555555555555', match_id: 'm1111111-1111-1111-1111-111111111111', round: 1, position: 5, team_id: 'a5555555-5555-5555-5555-555555555555' },
            { id: 'bn111111-6666-6666-6666-666666666666', match_id: 'm1111111-1111-1111-1111-111111111111', round: 1, position: 6, team_id: 'a6666666-6666-6666-6666-666666666666' },
            { id: 'bn111111-7777-7777-7777-777777777777', match_id: 'm1111111-1111-1111-1111-111111111111', round: 1, position: 7, team_id: 'a7777777-7777-7777-7777-777777777777' },
            { id: 'bn111111-8888-8888-8888-888888888888', match_id: 'm1111111-1111-1111-1111-111111111111', round: 1, position: 8, team_id: 'a8888888-8888-8888-8888-888888888888' },
            
            // 4강
            { id: 'bn222222-1111-1111-1111-111111111111', match_id: 'm1111111-1111-1111-1111-111111111111', round: 2, position: 1, team_id: 'a1111111-1111-1111-1111-111111111111', parent_node_id: 'bn111111-1111-1111-1111-111111111111' },
            { id: 'bn222222-2222-2222-2222-222222222222', match_id: 'm1111111-1111-1111-1111-111111111111', round: 2, position: 2, team_id: 'a3333333-3333-3333-3333-333333333333', parent_node_id: 'bn111111-3333-3333-3333-333333333333' },
            { id: 'bn222222-3333-3333-3333-333333333333', match_id: 'm1111111-1111-1111-1111-111111111111', round: 2, position: 3, team_id: 'a5555555-5555-5555-5555-555555555555', parent_node_id: 'bn111111-5555-5555-5555-555555555555' },
            { id: 'bn222222-4444-4444-4444-444444444444', match_id: 'm1111111-1111-1111-1111-111111111111', round: 2, position: 4, team_id: 'a7777777-7777-7777-7777-777777777777', parent_node_id: 'bn111111-7777-7777-7777-777777777777' },
            
            // 결승
            { id: 'bn333333-1111-1111-1111-111111111111', match_id: 'm1111111-1111-1111-1111-111111111111', round: 3, position: 1, team_id: 'a1111111-1111-1111-1111-111111111111', parent_node_id: 'bn222222-1111-1111-1111-111111111111' },
            { id: 'bn333333-2222-2222-2222-222222222222', match_id: 'm1111111-1111-1111-1111-111111111111', round: 3, position: 2, team_id: 'a5555555-5555-5555-5555-555555555555', parent_node_id: 'bn222222-3333-3333-3333-333333333333' }
        ];

        const { error: bracketError } = await supabase
            .from('bracket_nodes')
            .upsert(bracketNodes, { onConflict: 'id' });

        if (bracketError) {
            console.error('Bracket nodes insert error:', bracketError);
        }

        // 4. 실제 경기 결과 (games)
        const games = [
            // 8강전
            { 
                id: 'g1111111-1111-1111-1111-111111111111', 
                match_id: 'm1111111-1111-1111-1111-111111111111', 
                home_team_id: 'a1111111-1111-1111-1111-111111111111', 
                away_team_id: 'a2222222-2222-2222-2222-222222222222', 
                home_score: 3, 
                away_score: 1, 
                status: 'completed',
                round: 1,
                bracket_position: 1
            },
            { 
                id: 'g1111111-2222-2222-2222-222222222222', 
                match_id: 'm1111111-1111-1111-1111-111111111111', 
                home_team_id: 'a3333333-3333-3333-3333-333333333333', 
                away_team_id: 'a4444444-4444-4444-4444-444444444444', 
                home_score: 2, 
                away_score: 1, 
                status: 'completed',
                round: 1,
                bracket_position: 2
            },
            { 
                id: 'g1111111-3333-3333-3333-333333333333', 
                match_id: 'm1111111-1111-1111-1111-111111111111', 
                home_team_id: 'a5555555-5555-5555-5555-555555555555', 
                away_team_id: 'a6666666-6666-6666-6666-666666666666', 
                home_score: 4, 
                away_score: 2, 
                status: 'completed',
                round: 1,
                bracket_position: 3
            },
            { 
                id: 'g1111111-4444-4444-4444-444444444444', 
                match_id: 'm1111111-1111-1111-1111-111111111111', 
                home_team_id: 'a7777777-7777-7777-7777-777777777777', 
                away_team_id: 'a8888888-8888-8888-8888-888888888888', 
                home_score: 2, 
                away_score: 3, 
                status: 'completed',
                round: 1,
                bracket_position: 4
            },
            
            // 4강전
            { 
                id: 'g2222222-1111-1111-1111-111111111111', 
                match_id: 'm1111111-1111-1111-1111-111111111111', 
                home_team_id: 'a1111111-1111-1111-1111-111111111111', 
                away_team_id: 'a3333333-3333-3333-3333-333333333333', 
                home_score: 2, 
                away_score: 0, 
                status: 'completed',
                round: 2,
                bracket_position: 1
            },
            { 
                id: 'g2222222-2222-2222-2222-222222222222', 
                match_id: 'm1111111-1111-1111-1111-111111111111', 
                home_team_id: 'a5555555-5555-5555-5555-555555555555', 
                away_team_id: 'a7777777-7777-7777-7777-777777777777', 
                home_score: 3, 
                away_score: 2, 
                status: 'completed',
                round: 2,
                bracket_position: 2
            },
            
            // 결승전
            { 
                id: 'g3333333-1111-1111-1111-111111111111', 
                match_id: 'm1111111-1111-1111-1111-111111111111', 
                home_team_id: 'a1111111-1111-1111-1111-111111111111', 
                away_team_id: 'a5555555-5555-5555-5555-555555555555', 
                home_score: 1, 
                away_score: 2, 
                status: 'completed',
                round: 3,
                bracket_position: 1
            },
            
            // 리그전 경기들
            { 
                id: 'g4444444-1111-1111-1111-111111111111', 
                match_id: 'm2222222-2222-2222-2222-222222222222', 
                home_team_id: 'a1111111-1111-1111-1111-111111111111', 
                away_team_id: 'a2222222-2222-2222-2222-222222222222', 
                home_score: 2, 
                away_score: 2, 
                status: 'completed'
            },
            { 
                id: 'g4444444-2222-2222-2222-222222222222', 
                match_id: 'm2222222-2222-2222-2222-222222222222', 
                home_team_id: 'a3333333-3333-3333-3333-333333333333', 
                away_team_id: 'a4444444-4444-4444-4444-444444444444', 
                home_score: 1, 
                away_score: 0, 
                status: 'completed'
            },
            { 
                id: 'g4444444-3333-3333-3333-333333333333', 
                match_id: 'm2222222-2222-2222-2222-222222222222', 
                home_team_id: 'a5555555-5555-5555-5555-555555555555', 
                away_team_id: 'a1111111-1111-1111-1111-111111111111', 
                home_score: 0, 
                away_score: 3, 
                status: 'completed'
            },
            
            // 농구 대회
            { 
                id: 'g5555555-1111-1111-1111-111111111111', 
                match_id: 'm3333333-3333-3333-3333-333333333333', 
                home_team_id: 'b1111111-1111-1111-1111-111111111111', 
                away_team_id: 'b2222222-2222-2222-2222-222222222222', 
                home_score: 78, 
                away_score: 72, 
                status: 'completed',
                round: 1,
                bracket_position: 1
            },
            { 
                id: 'g5555555-2222-2222-2222-222222222222', 
                match_id: 'm3333333-3333-3333-3333-333333333333', 
                home_team_id: 'b3333333-3333-3333-3333-333333333333', 
                away_team_id: 'b4444444-4444-4444-4444-444444444444', 
                home_score: 65, 
                away_score: 68, 
                status: 'completed',
                round: 1,
                bracket_position: 2
            }
        ];

        const { error: gamesError } = await supabase
            .from('games')
            .upsert(games, { onConflict: 'id' });

        if (gamesError) {
            console.error('Games insert error:', gamesError);
        }

        // 5. 통계 확인 - 단순화된 쿼리
        const { data: matchStats, error: statsError } = await supabase
            .from('matches')
            .select('id, title, type, status');

        if (statsError) {
            console.error('Stats query error:', statsError);
        }

        // 각 match에 대한 참가팀 수 가져오기
        interface MatchStat {
            id: string;
            title: string;
            type: string;
            status: string;
        }

        const summary = await Promise.all(
            ((matchStats || []) as MatchStat[]).map(async (match: MatchStat) => {
                const { data: participants } = await supabase
                    .from('match_participants')
                    .select('status')
                    .eq('match_id', match.id);

                const { data: bracketNodes } = await supabase
                    .from('bracket_nodes')
                    .select('id')
                    .eq('match_id', match.id);

                const { data: games } = await supabase
                    .from('games')
                    .select('id')
                    .eq('match_id', match.id);

                return {
                    title: match.title,
                    type: match.type,
                    status: match.status,
                    participants: participants?.length || 0,
                    approved: participants?.filter((p: any) => p.status === 'approved').length || 0,
                    bracketNodes: bracketNodes?.length || 0,
                    games: games?.length || 0
                };
            })
        );

        return NextResponse.json({
            success: true,
            message: '경기 참가 데이터가 성공적으로 생성되었습니다',
            summary
        });

    } catch (error) {
        console.error('Seed data error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}