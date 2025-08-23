import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// 환경 변수 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

// 테스트 사용자 생성 또는 가져오기
async function getOrCreateTestUser(email: string, name: string) {
    try {
        // auth.users에서 먼저 찾기
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
            // admin API 사용 불가시 프로필에서 찾기
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*')
                .limit(1);
            
            if (profiles && profiles.length > 0) {
                return {
                    id: profiles[0].user_id,
                    email: email,
                    full_name: name
                };
            }
        }

        // 기존 사용자 찾기
        if (authData && authData.users) {
            const existingUser = authData.users.find(u => u.email === email);
            if (existingUser) {
                return {
                    id: existingUser.id,
                    email: existingUser.email,
                    full_name: name
                };
            }
        }

        // 새 사용자 생성 (auth.signUp 사용)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: 'testPassword123!',
            options: {
                data: {
                    display_name: name
                }
            }
        });

        if (signUpError) {
            console.error('사용자 생성 실패:', signUpError);
            // 대체: 첫 번째 프로필 사용
            const { data: anyProfile } = await supabase
                .from('profiles')
                .select('*')
                .limit(1)
                .single();
            
            if (anyProfile) {
                return {
                    id: anyProfile.user_id,
                    email: email,
                    full_name: name
                };
            }
            throw signUpError;
        }

        if (signUpData.user) {
            // 프로필 생성
            await supabase
                .from('profiles')
                .insert({
                    user_id: signUpData.user.id,
                    bio: `${name}의 프로필`,
                    preferences: { display_name: name }
                });

            return {
                id: signUpData.user.id,
                email: signUpData.user.email || email,
                full_name: name
            };
        }

        throw new Error('사용자 생성 실패');
    } catch (error) {
        console.error('사용자 생성 오류:', error);
        // 오류 시 더미 ID 반환
        return {
            id: 'dummy-user-id',
            email: email,
            full_name: name
        };
    }
}

// 테스트 팀 생성
async function createTestTeams(count: number) {
    const teams = [];
    
    for (let i = 1; i <= count; i++) {
        const teamData = {
            name: `테스트 팀 ${i}`,
            description: `테스트를 위한 ${i}번 팀입니다.`,
            captain_id: null, // 나중에 업데이트
            captain_name: `주장${i}`,
            sport_type: 'soccer',
            location: '서울',
            max_members: 20,
            current_members: 5 + Math.floor(Math.random() * 10)
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
async function createTestMatch(type: string, maxTeams: number, creatorId: string) {
    const matchTypes: Record<string, any> = {
        'single_elimination': { name: '단일 엘리미네이션 토너먼트', maxTeams: 8 },
        'double_elimination': { name: '더블 엘리미네이션 토너먼트', maxTeams: 8 },
        'round_robin': { name: '리그전 (풀 라운드로빈)', maxTeams: 6 },
        'swiss': { name: '스위스 토너먼트', maxTeams: 16 },
        'league': { name: '정규 리그', maxTeams: 10 }
    };

    const config = matchTypes[type];
    const actualMaxTeams = Math.min(maxTeams, config.maxTeams);

    const matchData = {
        title: `테스트 ${config.name} (${actualMaxTeams}팀)`,
        description: `${config.name} 방식 테스트를 위한 경기입니다.`,
        type,
        status: 'registration',
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1주일 후
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2주일 후
        location: '테스트 경기장',
        max_teams: actualMaxTeams,
        current_teams: 0,
        entry_fee: 0,
        prize_pool: 100000,
        rules: '테스트 규칙',
        format: '11 vs 11',
        creator_id: creatorId,
        is_public: true,
        registration_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
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
        if (error.code === '23505') { // unique violation
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
            reviewed_at: new Date().toISOString()
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

// 대진표 생성
async function generateBracket(matchId: string, type: string, teams: any[]) {
    await log(`\n📊 대진표 생성 중...`, 'blue');

    // 경기 타입별 대진표 생성 로직
    if (type === 'single_elimination' || type === 'double_elimination') {
        return await generateEliminationBracket(matchId, type, teams);
    } else if (type === 'round_robin') {
        return await generateRoundRobinBracket(matchId, teams);
    } else if (type === 'swiss') {
        return await generateSwissBracket(matchId, teams);
    } else if (type === 'league') {
        return await generateLeagueBracket(matchId, teams);
    }
}

// 엘리미네이션 대진표 생성
async function generateEliminationBracket(matchId: string, type: string, teams: any[]) {
    const rounds = Math.ceil(Math.log2(teams.length));
    const games = [];

    // 1라운드 게임 생성
    for (let i = 0; i < teams.length; i += 2) {
        const gameData = {
            match_id: matchId,
            round: 1,
            game_number: Math.floor(i / 2),
            team1_id: teams[i]?.team_id || null,
            team2_id: teams[i + 1]?.team_id || null,
            status: 'scheduled',
            bracket_type: type === 'double_elimination' ? 'winners' : 'main',
            scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        const { data, error } = await supabase
            .from('games')
            .insert(gameData)
            .select()
            .single();

        if (!error) {
            games.push(data);
            const team1Name = teams[i]?.team?.name || 'BYE';
            const team2Name = teams[i + 1]?.team?.name || 'BYE';
            await log(`   게임 ${data.game_number + 1}: ${team1Name} vs ${team2Name}`, 'cyan');
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
                bracket_type: type === 'double_elimination' ? 'winners' : 'main',
                scheduled_at: new Date(Date.now() + (6 + round) * 24 * 60 * 60 * 1000).toISOString()
            };

            const { data } = await supabase
                .from('games')
                .insert(gameData)
                .select()
                .single();

            if (data) {
                games.push(data);
            }
        }
    }

    // 더블 엘리미네이션의 경우 패자 브라켓도 생성
    if (type === 'double_elimination') {
        await log(`   패자 브라켓 생성 중...`, 'yellow');
        
        // 패자 브라켓 라운드 생성 (간단한 버전)
        for (let round = 1; round <= rounds - 1; round++) {
            const gamesInRound = Math.pow(2, rounds - round - 1);
            
            for (let i = 0; i < gamesInRound; i++) {
                const gameData = {
                    match_id: matchId,
                    round: round,
                    game_number: i,
                    team1_id: null,
                    team2_id: null,
                    status: 'scheduled',
                    bracket_type: 'losers',
                    scheduled_at: new Date(Date.now() + (7 + round) * 24 * 60 * 60 * 1000).toISOString()
                };

                await supabase
                    .from('games')
                    .insert(gameData)
                    .select()
                    .single();
            }
        }

        // 최종 결승전 (Grand Final)
        await supabase
            .from('games')
            .insert({
                match_id: matchId,
                round: rounds + 1,
                game_number: 0,
                team1_id: null,
                team2_id: null,
                status: 'scheduled',
                bracket_type: 'final',
                scheduled_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();
    }

    await log(`   ✅ ${type} 대진표 생성 완료 (${rounds}라운드)`, 'green');
    return games;
}

// 리그전 대진표 생성
async function generateRoundRobinBracket(matchId: string, teams: any[]) {
    const games = [];
    let gameNumber = 0;

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
                bracket_type: 'round_robin',
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

    await log(`   ✅ 리그전 대진표 생성 완료 (총 ${games.length}경기)`, 'green');
    return games;
}

// 스위스 대진표 생성 (1라운드만)
async function generateSwissBracket(matchId: string, teams: any[]) {
    const games = [];
    
    // 첫 라운드는 랜덤 매칭
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
            const gameData = {
                match_id: matchId,
                round: 1,
                game_number: Math.floor(i / 2),
                team1_id: shuffled[i].team_id,
                team2_id: shuffled[i + 1].team_id,
                status: 'scheduled',
                bracket_type: 'swiss',
                scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };

            const { data } = await supabase
                .from('games')
                .insert(gameData)
                .select()
                .single();

            if (data) {
                games.push(data);
            }
        }
    }

    await log(`   ✅ 스위스 토너먼트 1라운드 생성 완료`, 'green');
    return games;
}

// 리그 대진표 생성
async function generateLeagueBracket(matchId: string, teams: any[]) {
    // 리그전과 동일하지만 홈/어웨이 구분
    return await generateRoundRobinBracket(matchId, teams);
}

// 참가 제한 테스트
async function testParticipationLimit(matchId: string, maxTeams: number) {
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
        await log(`   ✅ 참가 마감 상태 확인 완료`, 'green');
        
        // 추가 신청 시도
        const extraTeam = await createTestTeams(1);
        if (extraTeam.length > 0) {
            const result = await applyToMatch(matchId, extraTeam[0].id, extraTeam[0].name);
            if (!result) {
                await log(`   ✅ 추가 신청 차단 확인`, 'green');
            } else {
                await log(`   ❌ 경고: 마감된 경기에 추가 신청이 가능함!`, 'red');
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

        // 1. 테스트 사용자 생성
        await log('\n👤 테스트 사용자 생성...', 'blue');
        const testUser = await getOrCreateTestUser('test-organizer@thematch.com', '테스트 주최자');
        await log(`   ✅ 사용자: ${testUser.full_name}`, 'green');

        // 2. 테스트 팀 생성
        await log('\n👥 테스트 팀 생성...', 'blue');
        const teams = await createTestTeams(20); // 충분한 수의 팀 생성
        await log(`   ✅ 총 ${teams.length}팀 생성 완료`, 'green');

        // 3. 각 경기 방식별 테스트
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
            const match = await createTestMatch(
                matchType.type,
                matchType.maxTeams,
                testUser.id
            );

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
                await generateBracket(match.id, matchType.type, approved);
            }

            // 참가 제한 테스트
            await testParticipationLimit(match.id, matchType.maxTeams);

            // 경기 상태 업데이트
            await supabase
                .from('matches')
                .update({
                    current_teams: approved.length,
                    status: approved.length >= matchType.maxTeams ? 'in_progress' : 'registration'
                })
                .eq('id', match.id);

            await log(`\n📊 경기 상태:`, 'magenta');
            await log(`   - 참가 신청: ${applications.length}팀`, 'cyan');
            await log(`   - 승인됨: ${approved.length}팀`, 'cyan');
            await log(`   - 최대 팀: ${matchType.maxTeams}팀`, 'cyan');
            await log(`   - 상태: ${approved.length >= matchType.maxTeams ? '진행중' : '등록중'}`, 'cyan');
        }

        await log('\n' + '=' .repeat(50), 'cyan');
        await log('\n✅ 모든 테스트 완료!\n', 'green');

        // 생성된 경기 목록 출력
        const { data: matches } = await supabase
            .from('matches')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (matches && matches.length > 0) {
            await log('\n📋 생성된 테스트 경기:', 'blue');
            for (const match of matches) {
                await log(`   - ${match.title}`, 'cyan');
                await log(`     ID: ${match.id}`, 'reset');
                await log(`     팀: ${match.current_teams}/${match.max_teams}`, 'reset');
                await log(`     상태: ${match.status}`, 'reset');
            }
        }

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