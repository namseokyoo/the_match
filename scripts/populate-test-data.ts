import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user data
const testUsers = [
    // Tournament hosts
    { email: 'host1@test.com', password: 'test1234', name: '김대회', role: 'host' },
    { email: 'host2@test.com', password: 'test1234', name: '이주최', role: 'host' },
    { email: 'host3@test.com', password: 'test1234', name: '박운영', role: 'host' },
    
    // Team captains
    { email: 'captain1@test.com', password: 'test1234', name: '최주장', role: 'captain' },
    { email: 'captain2@test.com', password: 'test1234', name: '정리더', role: 'captain' },
    { email: 'captain3@test.com', password: 'test1234', name: '강팀장', role: 'captain' },
    { email: 'captain4@test.com', password: 'test1234', name: '윤대표', role: 'captain' },
    { email: 'captain5@test.com', password: 'test1234', name: '임캡틴', role: 'captain' },
    { email: 'captain6@test.com', password: 'test1234', name: '한주장', role: 'captain' },
    { email: 'captain7@test.com', password: 'test1234', name: '서리더', role: 'captain' },
    { email: 'captain8@test.com', password: 'test1234', name: '문팀장', role: 'captain' },
    
    // Regular players
    { email: 'player1@test.com', password: 'test1234', name: '김선수', role: 'player' },
    { email: 'player2@test.com', password: 'test1234', name: '이선수', role: 'player' },
    { email: 'player3@test.com', password: 'test1234', name: '박선수', role: 'player' },
    { email: 'player4@test.com', password: 'test1234', name: '정선수', role: 'player' },
    { email: 'player5@test.com', password: 'test1234', name: '최선수', role: 'player' },
    { email: 'player6@test.com', password: 'test1234', name: '강선수', role: 'player' },
    { email: 'player7@test.com', password: 'test1234', name: '조선수', role: 'player' },
    { email: 'player8@test.com', password: 'test1234', name: '윤선수', role: 'player' },
    { email: 'player9@test.com', password: 'test1234', name: '장선수', role: 'player' },
    { email: 'player10@test.com', password: 'test1234', name: '임선수', role: 'player' },
    { email: 'player11@test.com', password: 'test1234', name: '한선수', role: 'player' },
    { email: 'player12@test.com', password: 'test1234', name: '오선수', role: 'player' },
    { email: 'player13@test.com', password: 'test1234', name: '서선수', role: 'player' },
    { email: 'player14@test.com', password: 'test1234', name: '신선수', role: 'player' },
    { email: 'player15@test.com', password: 'test1234', name: '권선수', role: 'player' },
    { email: 'player16@test.com', password: 'test1234', name: '황선수', role: 'player' },
    { email: 'player17@test.com', password: 'test1234', name: '안선수', role: 'player' },
    { email: 'player18@test.com', password: 'test1234', name: '송선수', role: 'player' },
    { email: 'player19@test.com', password: 'test1234', name: '전선수', role: 'player' },
    { email: 'player20@test.com', password: 'test1234', name: '홍선수', role: 'player' },
];

async function cleanDatabase() {
    console.log('🧹 Cleaning database...');
    
    // Delete in order of dependencies
    await supabase.from('team_join_requests').delete().neq('id', '');
    await supabase.from('match_participants').delete().neq('id', '');
    await supabase.from('players').delete().neq('id', '');
    await supabase.from('teams').delete().neq('id', '');
    await supabase.from('matches').delete().neq('id', '');
    await supabase.from('profiles').delete().neq('id', '');
    
    console.log('✅ Database cleaned');
}

async function createUsers() {
    console.log('👥 Creating test users...');
    const createdUsers = [];
    
    for (const user of testUsers) {
        try {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true
            });
            
            if (authError) {
                console.log(`⚠️ User ${user.email} might already exist:`, authError.message);
                // Try to get existing user
                const { data: existingUsers } = await supabase.auth.admin.listUsers();
                const existingUser = existingUsers?.users.find(u => u.email === user.email);
                if (existingUser) {
                    createdUsers.push({ ...user, id: existingUser.id });
                }
                continue;
            }
            
            if (authData?.user) {
                // Create profile
                await supabase.from('profiles').insert({
                    id: authData.user.id,
                    email: user.email,
                    full_name: user.name
                });
                
                createdUsers.push({ ...user, id: authData.user.id });
                console.log(`✅ Created user: ${user.email} (${user.role})`);
            }
        } catch (error) {
            console.error(`❌ Error creating user ${user.email}:`, error);
        }
    }
    
    return createdUsers;
}

async function createMatches(users: any[]) {
    console.log('🏆 Creating matches...');
    const hosts = users.filter(u => u.role === 'host');
    const matches = [];
    
    // Match 1: 8인 싱글 엘리미네이션 (모집 완료)
    const match1 = await supabase.from('matches').insert({
        title: '2025 봄 배구 대회',
        description: '봄맞이 배구 대회입니다. 8팀이 참가하는 싱글 엘리미네이션 방식입니다.',
        type: 'single_elimination',
        status: 'registration',
        creator_id: hosts[0].id,
        max_participants: 8,
        registration_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        venue: '서울시립체육관',
        venue_address: '서울시 강남구 역삼동 123-45'
    }).select().single();
    if (match1.data) matches.push(match1.data);
    
    // Match 2: 16인 더블 엘리미네이션 (모집중)
    const match2 = await supabase.from('matches').insert({
        title: '전국 농구 챔피언십',
        description: '전국 규모의 농구 대회입니다. 16팀 더블 엘리미네이션 방식입니다.',
        type: 'double_elimination',
        status: 'registration',
        creator_id: hosts[1].id,
        max_participants: 16,
        registration_deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        start_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        venue: '인천 남동체육관',
        venue_address: '인천시 남동구 구월동 567-89'
    }).select().single();
    if (match2.data) matches.push(match2.data);
    
    // Match 3: 6팀 라운드 로빈 (진행중)
    const match3 = await supabase.from('matches').insert({
        title: '지역 축구 리그',
        description: '지역 축구 동호회 리그전입니다. 6팀 라운드 로빈 방식입니다.',
        type: 'round_robin',
        status: 'in_progress',
        creator_id: hosts[2].id,
        max_participants: 6,
        registration_deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        venue: '강북구민운동장',
        venue_address: '서울시 강북구 수유동 234-56'
    }).select().single();
    if (match3.data) matches.push(match3.data);
    
    // Match 4: 4팀 토너먼트 (완료)
    const match4 = await supabase.from('matches').insert({
        title: '미니 탁구 토너먼트',
        description: '소규모 탁구 대회입니다. 4팀만 참가하는 작은 대회입니다.',
        type: 'single_elimination',
        status: 'completed',
        creator_id: hosts[0].id,
        max_participants: 4,
        registration_deadline: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        venue: '송파구민체육센터',
        venue_address: '서울시 송파구 잠실동 789-12'
    }).select().single();
    if (match4.data) matches.push(match4.data);
    
    // Match 5: 32팀 대규모 대회 (모집중)
    const match5 = await supabase.from('matches').insert({
        title: '2025 e스포츠 월드컵',
        description: '대규모 e스포츠 대회입니다. 32팀이 참가하는 대형 이벤트입니다.',
        type: 'single_elimination',
        status: 'registration',
        creator_id: hosts[1].id,
        max_participants: 32,
        registration_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        start_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        venue: '코엑스 전시장',
        venue_address: '서울시 강남구 삼성동 159'
    }).select().single();
    if (match5.data) matches.push(match5.data);
    
    console.log(`✅ Created ${matches.length} matches`);
    return matches;
}

async function createTeams(users: any[], matches: any[]) {
    console.log('👥 Creating teams...');
    const captains = users.filter(u => u.role === 'captain');
    const teams = [];
    
    // Create teams with different recruitment statuses
    const teamConfigs = [
        { name: '불사조', recruitment_count: 5, description: '열정적인 팀입니다. 5명 모집중!' },
        { name: '타이탄즈', recruitment_count: 7, description: '강력한 팀을 만들어갑니다. 7명 모집!' },
        { name: '레전드', recruitment_count: null, description: '모집 완료된 전설의 팀' },
        { name: '챌린저스', recruitment_count: 3, description: '도전정신 가득! 3명만 더!' },
        { name: '워리어스', recruitment_count: null, description: '전사들의 팀, 모집 완료' },
        { name: '드래곤즈', recruitment_count: 10, description: '대규모 팀 구성중! 10명 모집!' },
        { name: '유나이티드', recruitment_count: 4, description: '단결된 팀, 4명 추가 모집' },
        { name: '라이트닝', recruitment_count: null, description: '번개같은 팀, 모집 마감' },
        { name: '팬텀', recruitment_count: 6, description: '유령같은 플레이! 6명 모집중' },
        { name: '베테랑즈', recruitment_count: 2, description: '경험 많은 선수 2명만 모집' },
        { name: '루키즈', recruitment_count: 8, description: '신인 대환영! 8명 모집!' }
    ];
    
    for (let i = 0; i < Math.min(captains.length, teamConfigs.length); i++) {
        const team = await supabase.from('teams').insert({
            name: teamConfigs[i].name,
            description: teamConfigs[i].description,
            captain_id: captains[i].id,
            recruitment_count: teamConfigs[i].recruitment_count,
            current_members: teamConfigs[i].recruitment_count ? 1 : 5
        }).select().single();
        
        if (team.data) {
            teams.push(team.data);
            console.log(`✅ Created team: ${team.data.name} (Captain: ${captains[i].name})`);
            
            // Create captain as player
            await supabase.from('players').insert({
                name: captains[i].name,
                email: captains[i].email,
                team_id: team.data.id,
                position: '주장',
                jersey_number: 1
            });
        }
    }
    
    return teams;
}

async function createTeamJoinRequests(users: any[], teams: any[]) {
    console.log('📝 Creating team join requests...');
    const players = users.filter(u => u.role === 'player');
    const recruitingTeams = teams.filter(t => t.recruitment_count !== null);
    
    let requestCount = 0;
    
    // Create various join request scenarios
    for (let i = 0; i < Math.min(players.length, 15); i++) {
        const teamIndex = i % recruitingTeams.length;
        const team = recruitingTeams[teamIndex];
        
        // Create different status requests
        let status = 'pending';
        if (i % 3 === 0) status = 'approved';
        if (i % 5 === 0) status = 'rejected';
        
        const request = await supabase.from('team_join_requests').insert({
            team_id: team.id,
            user_id: players[i].id,
            player_name: players[i].name,
            player_email: players[i].email,
            position: ['포워드', '가드', '센터', '미드필더', '수비수', '공격수'][i % 6],
            jersey_number: i + 10,
            message: `${team.name} 팀에 합류하고 싶습니다!`,
            status: status,
            responded_at: status !== 'pending' ? new Date().toISOString() : null,
            responded_by: status !== 'pending' ? team.captain_id : null
        }).select().single();
        
        if (request.data) {
            requestCount++;
            
            // If approved, add as player
            if (status === 'approved') {
                await supabase.from('players').insert({
                    name: players[i].name,
                    email: players[i].email,
                    team_id: team.id,
                    position: request.data.position,
                    jersey_number: request.data.jersey_number
                });
                
                // Update team member count
                await supabase.from('teams')
                    .update({ current_members: team.current_members + 1 })
                    .eq('id', team.id);
            }
        }
    }
    
    console.log(`✅ Created ${requestCount} team join requests`);
}

async function createMatchParticipants(teams: any[], matches: any[]) {
    console.log('🎯 Creating match participants...');
    let participantCount = 0;
    
    // Assign teams to matches
    const matchParticipants = [
        // Match 1 (8팀 모집 완료)
        { match: matches[0], teams: teams.slice(0, 8), statuses: ['approved', 'approved', 'approved', 'approved', 'approved', 'approved', 'approved', 'approved'] },
        // Match 2 (16팀 모집중)
        { match: matches[1], teams: teams.slice(0, 10), statuses: ['approved', 'approved', 'approved', 'approved', 'approved', 'pending', 'pending', 'pending', 'rejected', 'rejected'] },
        // Match 3 (6팀 진행중)
        { match: matches[2], teams: teams.slice(0, 6), statuses: ['approved', 'approved', 'approved', 'approved', 'approved', 'approved'] },
        // Match 4 (4팀 완료)
        { match: matches[3], teams: teams.slice(0, 4), statuses: ['approved', 'approved', 'approved', 'approved'] },
        // Match 5 (32팀 모집중)
        { match: matches[4], teams: teams.slice(0, 11), statuses: ['approved', 'approved', 'approved', 'pending', 'pending', 'pending', 'pending', 'pending', 'rejected', 'rejected', 'rejected'] }
    ];
    
    for (const mp of matchParticipants) {
        if (!mp.match) continue;
        
        for (let i = 0; i < mp.teams.length && i < mp.statuses.length; i++) {
            const participant = await supabase.from('match_participants').insert({
                match_id: mp.match.id,
                team_id: mp.teams[i].id,
                status: mp.statuses[i],
                applied_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                responded_at: mp.statuses[i] !== 'pending' ? new Date().toISOString() : null,
                response_by: mp.statuses[i] !== 'pending' ? mp.match.creator_id : null,
                notes: mp.statuses[i] === 'rejected' ? '팀 요건이 충족되지 않습니다.' : null
            }).select().single();
            
            if (participant.data) {
                participantCount++;
            }
        }
    }
    
    console.log(`✅ Created ${participantCount} match participants`);
}

async function main() {
    try {
        console.log('🚀 Starting test data population...\n');
        
        // Clean database first
        await cleanDatabase();
        
        // Create users
        const users = await createUsers();
        console.log(`\n📊 Created ${users.length} users`);
        
        // Create matches
        const matches = await createMatches(users);
        console.log(`📊 Created ${matches.length} matches`);
        
        // Create teams
        const teams = await createTeams(users, matches);
        console.log(`📊 Created ${teams.length} teams`);
        
        // Create team join requests
        await createTeamJoinRequests(users, teams);
        
        // Create match participants
        await createMatchParticipants(teams, matches);
        
        console.log('\n✨ Test data population completed successfully!');
        console.log('\n📝 Test Accounts:');
        console.log('================');
        console.log('All passwords: test1234\n');
        console.log('Tournament Hosts:');
        console.log('- host1@test.com (김대회)');
        console.log('- host2@test.com (이주최)');
        console.log('- host3@test.com (박운영)\n');
        console.log('Team Captains:');
        console.log('- captain1@test.com (최주장)');
        console.log('- captain2@test.com (정리더)');
        console.log('- captain3@test.com (강팀장)\n');
        console.log('Regular Players:');
        console.log('- player1@test.com (김선수)');
        console.log('- player2@test.com (이선수)');
        console.log('- player3@test.com (박선수)');
        console.log('... and 17 more players\n');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
main();