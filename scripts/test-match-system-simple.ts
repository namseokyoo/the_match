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

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

async function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 실제 존재하는 사용자 ID 사용 (테스트용)
const TEST_USER_ID = 'bf7d566e-4aed-4b4d-950a-3e275a8196d2';

// 테스트 팀 생성
async function createTestTeams(count: number) {
    const teams = [];
    const userId = TEST_USER_ID;
    
    for (let i = 1; i <= count; i++) {
        const teamData = {
            name: `테스트 팀 ${i}`,
            description: `테스트를 위한 ${i}번 팀입니다.`,
            captain_id: null, // Foreign key constraint, set to null
            logo_url: `https://picsum.photos/seed/team${i}/200`
        };

        const { data, error } = await supabase
            .from('teams')
            .insert(teamData)
            .select()
            .single();

        if (error) {
            console.error(`팀 ${i} 생성 실패:`, error);
            continue;
        }

        teams.push(data);
        await log(`✅ 팀 생성: ${data.name}`, 'green');
    }

    return teams;
}

// 경기 생성
async function createTestMatch(type: string, maxTeams: number) {
    const matchTypes: Record<string, any> = {
        'single_elimination': { name: '단일 엘리미네이션', maxTeams: 8 },
        'double_elimination': { name: '더블 엘리미네이션', maxTeams: 8 },
        'round_robin': { name: '리그전', maxTeams: 6 },
        'swiss': { name: '스위스', maxTeams: 16 },
        'league': { name: '정규 리그', maxTeams: 10 }
    };

    const config = matchTypes[type];
    const actualMaxTeams = Math.min(maxTeams, config.maxTeams);
    const userId = TEST_USER_ID;

    const matchData = {
        title: `테스트 ${config.name} (${actualMaxTeams}팀)`,
        description: `${config.name} 방식 테스트를 위한 경기입니다.`,
        type,
        status: 'registration',
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        max_participants: actualMaxTeams,
        creator_id: userId,
        registration_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        rules: {
            format: '11 vs 11',
            entry_fee: 0,
            prize_pool: 100000
        },
        settings: {
            location: '테스트 경기장',
            is_public: true
        }
    };

    const { data, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select()
        .single();

    if (error) {
        console.error('경기 생성 실패:', error);
        return null;
    }

    await log(`\n🏆 경기 생성: ${data.title}`, 'blue');
    await log(`   - ID: ${data.id}`, 'cyan');
    await log(`   - 타입: ${type}`, 'cyan');
    await log(`   - 최대 팀: ${actualMaxTeams}팀`, 'cyan');
    
    return data;
}

// 참가 신청
async function applyToMatch(matchId: string, teamId: string, teamName: string) {
    const { data, error } = await supabase
        .from('match_participants')
        .insert({
            match_id: matchId,
            team_id: teamId,
            status: 'pending',
            notes: `${teamName}팀 참가 신청합니다!`,
            applied_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            await log(`   ⚠️  ${teamName} - 이미 신청됨`, 'yellow');
        } else {
            console.error('참가 신청 실패:', error);
        }
        return null;
    }

    await log(`   📝 참가 신청: ${teamName}`, 'magenta');
    return data;
}

// 참가 승인
async function approveParticipant(participantId: string, teamName: string) {
    const { data, error } = await supabase
        .from('match_participants')
        .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: TEST_USER_ID
        })
        .eq('id', participantId)
        .select()
        .single();

    if (error) {
        console.error('승인 실패:', error);
        return null;
    }

    await log(`   ✅ 참가 승인: ${teamName}`, 'green');
    return data;
}

// 대진표 생성 (엘리미네이션)
async function generateEliminationBracket(matchId: string, type: string, teams: any[]) {
    const rounds = Math.ceil(Math.log2(teams.length));
    const games = [];
    
    await log(`\n📊 ${type} 대진표 생성 중...`, 'blue');
    await log(`   라운드 수: ${rounds}`, 'cyan');

    // 1라운드 게임 생성
    for (let i = 0; i < teams.length; i += 2) {
        const gameData = {
            match_id: matchId,
            round: 1,
            game_number: Math.floor(i / 2),
            team1_id: teams[i]?.team_id || null,
            team2_id: teams[i + 1]?.team_id || null,
            status: 'scheduled',
            scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        const { data, error } = await supabase
            .from('games')
            .insert(gameData)
            .select()
            .single();

        if (!error && data) {
            games.push(data);
            const team1Name = teams[i]?.team?.name || 'TBD';
            const team2Name = teams[i + 1]?.team?.name || 'TBD';
            await log(`   Round 1 Game ${data.game_number + 1}: ${team1Name} vs ${team2Name}`, 'cyan');
        }
    }

    // 나머지 라운드의 빈 게임 생성
    for (let round = 2; round <= rounds; round++) {
        const gamesInRound = Math.pow(2, rounds - round);
        
        for (let i = 0; i < gamesInRound; i++) {
            const gameData = {
                match_id: matchId,
                round: round,
                game_number: i,
                team1_id: null,
                team2_id: null,
                status: 'scheduled',
                scheduled_at: new Date(Date.now() + (6 + round) * 24 * 60 * 60 * 1000).toISOString()
            };

            await supabase
                .from('games')
                .insert(gameData)
                .select()
                .single();
        }
        await log(`   Round ${round}: ${gamesInRound}개 게임 슬롯 생성`, 'cyan');
    }

    await log(`   ✅ ${type} 대진표 생성 완료!`, 'green');
    return games;
}

// 리그전 대진표 생성
async function generateRoundRobinBracket(matchId: string, teams: any[]) {
    const games = [];
    let gameNumber = 0;
    
    await log(`\n📊 리그전 대진표 생성 중...`, 'blue');

    // 모든 팀이 서로 한 번씩 경기
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            const gameData = {
                match_id: matchId,
                round: 1,
                game_number: gameNumber++,
                team1_id: teams[i].team_id,
                team2_id: teams[j].team_id,
                status: 'scheduled',
                scheduled_at: new Date(Date.now() + (7 + Math.floor(gameNumber / 3)) * 24 * 60 * 60 * 1000).toISOString()
            };

            const { data, error } = await supabase
                .from('games')
                .insert(gameData)
                .select()
                .single();

            if (!error && data) {
                games.push(data);
            }
        }
    }

    await log(`   ✅ 리그전 대진표 생성 완료! (총 ${games.length}경기)`, 'green');
    return games;
}

// 참가 제한 테스트
async function testParticipationLimit(matchId: string, maxTeams: number, teams: any[]) {
    await log(`\n🔒 참가 제한 테스트...`, 'yellow');

    // 현재 승인된 팀 수 확인
    const { data: participants, error } = await supabase
        .from('match_participants')
        .select('*')
        .eq('match_id', matchId)
        .eq('status', 'approved');

    if (error) {
        console.error('참가자 조회 실패:', error);
        return;
    }

    const approvedCount = participants?.length || 0;
    await log(`   현재 승인된 팀: ${approvedCount}/${maxTeams}`, 'cyan');

    if (approvedCount >= maxTeams) {
        await log(`   ✅ 참가 마감 상태!`, 'green');
        
        // 추가 팀으로 신청 시도
        if (teams.length > maxTeams) {
            const extraTeam = teams[maxTeams];
            await log(`   추가 신청 시도: ${extraTeam.name}`, 'yellow');
            const result = await applyToMatch(matchId, extraTeam.id, extraTeam.name);
            
            // 신청 후 다시 확인
            const { data: checkParticipants } = await supabase
                .from('match_participants')
                .select('*')
                .eq('match_id', matchId)
                .eq('team_id', extraTeam.id)
                .eq('status', 'approved')
                .single();

            if (checkParticipants) {
                await log(`   ❌ 경고: 마감된 경기에 추가 승인됨!`, 'red');
            } else {
                await log(`   ✅ 추가 팀은 pending 상태로 대기 중`, 'green');
            }
        }
    } else {
        await log(`   ℹ️  아직 ${maxTeams - approvedCount}팀 더 참가 가능`, 'blue');
    }
}

// 메인 테스트 함수
async function runMatchSystemTest() {
    try {
        await log('\n🚀 경기 시스템 종합 테스트 시작\n', 'magenta');
        await log('=' .repeat(50), 'cyan');

        // 1. 테스트 팀 생성
        await log('\n👥 테스트 팀 생성...', 'blue');
        const teams = await createTestTeams(20);
        await log(`   ✅ 총 ${teams.length}팀 생성 완료`, 'green');

        // 2. 각 경기 방식별 테스트
        const matchTypes = [
            { type: 'single_elimination', maxTeams: 8 },
            { type: 'double_elimination', maxTeams: 8 },
            { type: 'round_robin', maxTeams: 6 },
            { type: 'swiss', maxTeams: 16 },
            { type: 'league', maxTeams: 10 }
        ];

        for (const matchType of matchTypes) {
            await log('\n' + '=' .repeat(50), 'cyan');
            
            // 경기 생성
            const match = await createTestMatch(matchType.type, matchType.maxTeams);
            if (!match) continue;

            // 참가 신청
            await log(`\n📝 참가 신청 프로세스...`, 'yellow');
            const applications = [];
            
            // 최대 팀 수보다 2팀 더 많이 신청 시도
            for (let i = 0; i < Math.min(matchType.maxTeams + 2, teams.length); i++) {
                const app = await applyToMatch(match.id, teams[i].id, teams[i].name);
                if (app) applications.push({ ...app, team: teams[i] });
            }

            // 참가 승인 (최대 팀 수만큼만)
            await log(`\n✅ 참가 승인 프로세스...`, 'yellow');
            const approved = [];
            
            for (let i = 0; i < Math.min(matchType.maxTeams, applications.length); i++) {
                const result = await approveParticipant(
                    applications[i].id,
                    applications[i].team.name
                );
                if (result) {
                    approved.push({ ...applications[i], ...result });
                }
            }

            // 대진표 생성
            if (approved.length > 0) {
                if (matchType.type.includes('elimination')) {
                    await generateEliminationBracket(match.id, matchType.type, approved);
                } else if (matchType.type === 'round_robin' || matchType.type === 'league') {
                    await generateRoundRobinBracket(match.id, approved);
                } else if (matchType.type === 'swiss') {
                    // 스위스는 첫 라운드만
                    await generateEliminationBracket(match.id, 'swiss', approved);
                }
            }

            // 참가 제한 테스트
            await testParticipationLimit(match.id, matchType.maxTeams, teams);

            // 경기 상태 업데이트
            await supabase
                .from('matches')
                .update({
                    current_teams: approved.length,
                    status: approved.length >= matchType.maxTeams ? 'in_progress' : 'registration'
                })
                .eq('id', match.id);

            await log(`\n📊 경기 상태 요약:`, 'magenta');
            await log(`   - 경기 ID: ${match.id}`, 'cyan');
            await log(`   - 참가 신청: ${applications.length}팀`, 'cyan');
            await log(`   - 승인됨: ${approved.length}팀`, 'cyan');
            await log(`   - 최대 팀: ${matchType.maxTeams}팀`, 'cyan');
            await log(`   - 상태: ${approved.length >= matchType.maxTeams ? '진행중 (참가 마감)' : '등록중'}`, 'cyan');
        }

        await log('\n' + '=' .repeat(50), 'cyan');
        await log('\n✅ 모든 테스트 완료!\n', 'green');

        // 생성된 경기 요약
        const { data: matches } = await supabase
            .from('matches')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (matches && matches.length > 0) {
            await log('\n📋 생성된 테스트 경기 요약:', 'blue');
            await log('=' .repeat(50), 'cyan');
            
            for (const match of matches) {
                // 참가팀 수 조회
                const { data: participants } = await supabase
                    .from('match_participants')
                    .select('id')
                    .eq('match_id', match.id)
                    .eq('status', 'approved');
                
                const currentTeams = participants?.length || 0;
                
                await log(`\n📌 ${match.title}`, 'magenta');
                await log(`   - ID: ${match.id}`, 'reset');
                await log(`   - 타입: ${match.type}`, 'reset');
                await log(`   - 팀: ${currentTeams}/${match.max_participants}`, 'reset');
                await log(`   - 상태: ${match.status}`, match.status === 'in_progress' ? 'green' : 'yellow');
                
                // 게임 수 확인
                const { data: games } = await supabase
                    .from('games')
                    .select('id')
                    .eq('match_id', match.id);
                
                if (games) {
                    await log(`   - 생성된 게임: ${games.length}개`, 'cyan');
                }
            }
        }

        await log('\n' + '=' .repeat(50), 'cyan');
        await log('\n🎯 웹사이트에서 확인해보세요:', 'green');
        await log('   1. /matches 페이지에서 생성된 경기 확인', 'cyan');
        await log('   2. 각 경기 상세 페이지에서 참가팀 및 대진표 확인', 'cyan');
        await log('   3. 참가 마감된 경기는 추가 신청 불가 확인', 'cyan');

    } catch (error) {
        await log('\n❌ 테스트 실패:', 'red');
        console.error(error);
    }
}

// 스크립트 실행
runMatchSystemTest().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});