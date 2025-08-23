import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// 환경 변수 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Service Role Key 사용 (RLS 우회)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// 실제 존재하는 사용자 ID 사용
const TEST_USER_ID = 'bf7d566e-4aed-4b4d-950a-3e275a8196d2';

async function createBracketTest() {
    console.log('🏆 대진표 테스트 시작...\n');
    
    try {
        // 1. 새로운 매치 생성
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .insert({
                title: '대진표 테스트 토너먼트',
                description: '대진표가 제대로 표시되는지 테스트',
                type: 'single_elimination',
                status: 'registration',
                creator_id: TEST_USER_ID,
                max_participants: 8,
                registration_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                rules: { format: '11 vs 11' },
                settings: { location: '테스트 경기장' }
            })
            .select()
            .single();
            
        if (matchError) {
            console.error('매치 생성 실패:', matchError);
            return;
        }
        
        console.log('✅ 매치 생성 완료:', match.title);
        console.log('   ID:', match.id);
        
        // 2. 팀 생성
        const teams = [];
        for (let i = 1; i <= 8; i++) {
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .insert({
                    name: `브라켓 팀 ${i}`,
                    description: `대진표 테스트를 위한 팀 ${i}`,
                    captain_id: null,
                    logo_url: `https://picsum.photos/seed/bracket${i}/200`
                })
                .select()
                .single();
                
            if (teamError) {
                console.error(`팀 ${i} 생성 실패:`, teamError);
                continue;
            }
            
            teams.push(team);
            console.log(`✅ 팀 생성: ${team.name}`);
        }
        
        // 3. 팀 참가 신청
        console.log('\n📝 참가 신청 중...');
        const participants = [];
        
        for (const team of teams) {
            const { data: participant, error: participantError } = await supabase
                .from('match_participants')
                .insert({
                    match_id: match.id,
                    team_id: team.id,
                    status: 'approved', // 바로 승인 상태로
                    applied_at: new Date().toISOString(),
                    responded_at: new Date().toISOString(),
                    response_by: TEST_USER_ID
                })
                .select()
                .single();
                
            if (participantError) {
                console.error(`팀 ${team.name} 참가 신청 실패:`, participantError);
                continue;
            }
            
            participants.push(participant);
            console.log(`✅ 팀 승인: ${team.name}`);
        }
        
        // 4. games 테이블에 대진표 생성
        console.log('\n📊 대진표 생성 중...');
        
        // 1라운드 (8팀 -> 4경기)
        const round1Games = [];
        for (let i = 0; i < 4; i++) {
            const { data: game, error: gameError } = await supabase
                .from('games')
                .insert({
                    match_id: match.id,
                    round: 1,
                    game_number: i + 1,
                    team1_id: teams[i * 2]?.id || null,
                    team2_id: teams[i * 2 + 1]?.id || null,
                    status: 'scheduled',
                    scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    venue: `코트 ${i + 1}`
                })
                .select()
                .single();
                
            if (!gameError && game) {
                round1Games.push(game);
                console.log(`   Round 1 Game ${i + 1}: ${teams[i * 2]?.name} vs ${teams[i * 2 + 1]?.name}`);
            }
        }
        
        // 2라운드 (준결승)
        for (let i = 0; i < 2; i++) {
            await supabase
                .from('games')
                .insert({
                    match_id: match.id,
                    round: 2,
                    game_number: i + 1,
                    team1_id: null, // 1라운드 승자 대기
                    team2_id: null,
                    status: 'scheduled',
                    scheduled_at: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
                    venue: `코트 ${i + 1}`
                });
        }
        console.log('   Round 2: 2개 게임 슬롯 생성 (준결승)');
        
        // 3라운드 (결승)
        await supabase
            .from('games')
            .insert({
                match_id: match.id,
                round: 3,
                game_number: 1,
                team1_id: null, // 2라운드 승자 대기
                team2_id: null,
                status: 'scheduled',
                scheduled_at: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
                venue: '메인 코트'
            });
        console.log('   Round 3: 1개 게임 슬롯 생성 (결승)');
        
        // 5. bracket_nodes 테이블에도 데이터 생성 (선택사항)
        console.log('\n🌳 브라켓 노드 생성 중...');
        
        // 1라운드 노드
        for (let i = 0; i < 4; i++) {
            await supabase
                .from('bracket_nodes')
                .insert({
                    match_id: match.id,
                    round: 1,
                    position: i + 1,
                    team1_id: teams[i * 2]?.id || null,
                    team2_id: teams[i * 2 + 1]?.id || null,
                    game_id: round1Games[i]?.id || null
                });
        }
        console.log('   Round 1: 4개 브라켓 노드 생성');
        
        // 2라운드 노드
        for (let i = 0; i < 2; i++) {
            await supabase
                .from('bracket_nodes')
                .insert({
                    match_id: match.id,
                    round: 2,
                    position: i + 1,
                    team1_id: null,
                    team2_id: null,
                    parent_game_id: null
                });
        }
        console.log('   Round 2: 2개 브라켓 노드 생성');
        
        // 3라운드 노드
        await supabase
            .from('bracket_nodes')
            .insert({
                match_id: match.id,
                round: 3,
                position: 1,
                team1_id: null,
                team2_id: null,
                parent_game_id: null
            });
        console.log('   Round 3: 1개 브라켓 노드 생성');
        
        // 6. 경기 상태를 in_progress로 변경
        await supabase
            .from('matches')
            .update({ status: 'in_progress' })
            .eq('id', match.id);
            
        console.log('\n✅ 대진표 테스트 완료!');
        console.log(`\n🌐 웹사이트에서 확인하세요:`);
        console.log(`   http://localhost:3000/matches/${match.id}`);
        console.log(`   http://localhost:3000/matches/${match.id}/bracket`);
        
        // 7. 생성된 데이터 확인
        const { data: checkGames } = await supabase
            .from('games')
            .select('*')
            .eq('match_id', match.id);
            
        const { data: checkNodes } = await supabase
            .from('bracket_nodes')
            .select('*')
            .eq('match_id', match.id);
            
        console.log(`\n📊 데이터 확인:`);
        console.log(`   - games 테이블: ${checkGames?.length}개 게임`);
        console.log(`   - bracket_nodes 테이블: ${checkNodes?.length}개 노드`);
        
    } catch (error) {
        console.error('테스트 실패:', error);
    }
}

// 실행
createBracketTest();