// 팀 가입 및 경기 참가 프로세스 테스트 스크립트

const API_URL = 'http://localhost:3001/api';

// 테스트용 사용자 정보
const users = {
    captain: {
        email: 'captain@test.com',
        password: 'Test1234!',
        token: null
    },
    member1: {
        email: 'member1@test.com', 
        password: 'Test1234!',
        token: null
    },
    member2: {
        email: 'member2@test.com',
        password: 'Test1234!', 
        token: null
    },
    organizer: {
        email: 'organizer@test.com',
        password: 'Test1234!',
        token: null
    }
};

let teamId = null;
let matchId = null;
let joinRequestId = null;
let participantId = null;
let playerId = null;

// Supabase 인증
async function signIn(email, password) {
    const response = await fetch('https://pkeycuoaeddmblcwzhpo.supabase.co/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZXljdW9hZWRkbWJsY3d6aHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTMwMTEsImV4cCI6MjA2NzQ2OTAxMX0.4TAcFjlKxx8fDNBZeuYmvsdU8V06_1z-8U3IG84VQXY'
        },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        console.error(`Failed to sign in ${email}:`, await response.text());
        return null;
    }

    const data = await response.json();
    return data.access_token;
}

// 사용자 생성
async function createUser(email, password) {
    const response = await fetch('https://pkeycuoaeddmblcwzhpo.supabase.co/auth/v1/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZXljdW9hZWRkbWJsY3d6aHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTMwMTEsImV4cCI6MjA2NzQ2OTAxMX0.4TAcFjlKxx8fDNBZeuYmvsdU8V06_1z-8U3IG84VQXY'
        },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        console.error(`Failed to create user ${email}:`, await response.text());
        return false;
    }

    return true;
}

// 1. 사용자 생성 및 로그인
async function setupUsers() {
    console.log('\n1. 사용자 생성 및 로그인...');
    
    for (const [key, user] of Object.entries(users)) {
        // 먼저 로그인 시도
        let token = await signIn(user.email, user.password);
        
        // 로그인 실패시 회원가입 후 재로그인
        if (!token) {
            await createUser(user.email, user.password);
            token = await signIn(user.email, user.password);
        }
        
        if (token) {
            users[key].token = token;
            console.log(`✅ ${key} 로그인 성공`);
        } else {
            console.log(`❌ ${key} 로그인 실패`);
        }
    }
}

// 2. 팀 생성 (captain이 생성)
async function createTeam() {
    console.log('\n2. 팀 생성...');
    
    // 먼저 captain의 user ID 가져오기
    const userResponse = await fetch('https://pkeycuoaeddmblcwzhpo.supabase.co/auth/v1/user', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${users.captain.token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZXljdW9hZWRkbWJsY3d6aHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTMwMTEsImV4cCI6MjA2NzQ2OTAxMX0.4TAcFjlKxx8fDNBZeuYmvsdU8V06_1z-8U3IG84VQXY'
        }
    });
    
    const userData = await userResponse.json();
    const captainUserId = userData.id;
    
    const response = await fetch(`${API_URL}/teams`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${users.captain.token}`
        },
        body: JSON.stringify({
            name: '테스트 FC',
            description: '팀 가입 테스트를 위한 팀입니다',
            captain_name: 'Captain Kim',
            captain_id: captainUserId
        })
    });

    if (!response.ok) {
        console.error('Failed to create team:', await response.text());
        return;
    }

    const data = await response.json();
    teamId = data.data.id;
    console.log(`✅ 팀 생성 완료: ${data.data.name} (ID: ${teamId})`);
}

// 3. 팀 가입 신청 (member1이 신청)
async function requestJoinTeam() {
    console.log('\n3. 팀 가입 신청...');
    
    const response = await fetch(`${API_URL}/teams/${teamId}/join-requests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${users.member1.token}`
        },
        body: JSON.stringify({
            player_name: 'Member One',
            player_email: users.member1.email,
            position: 'Forward',
            jersey_number: 10,
            message: '열심히 하겠습니다!'
        })
    });

    if (!response.ok) {
        console.error('Failed to request join team:', await response.text());
        return;
    }

    const data = await response.json();
    joinRequestId = data.request.id;
    console.log(`✅ 팀 가입 신청 완료 (Request ID: ${joinRequestId})`);
}

// 4. 팀 가입 승인 (captain이 승인)
async function approveJoinRequest() {
    console.log('\n4. 팀 가입 승인...');
    
    const response = await fetch(`${API_URL}/teams/${teamId}/join-requests`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${users.captain.token}`
        },
        body: JSON.stringify({
            requestId: joinRequestId,
            status: 'approved',
            response_message: '환영합니다!'
        })
    });

    if (!response.ok) {
        console.error('Failed to approve join request:', await response.text());
        return;
    }

    const data = await response.json();
    if (data.player) {
        playerId = data.player.id;
        console.log(`✅ 팀 가입 승인 완료. Player ID: ${playerId}`);
    } else {
        console.log(`✅ 팀 가입 승인 완료`);
    }
}

// 5. 경기 생성 (organizer가 생성)
async function createMatch() {
    console.log('\n5. 경기 생성...');
    
    const response = await fetch(`${API_URL}/matches`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${users.organizer.token}`
        },
        body: JSON.stringify({
            title: '테스트 리그 2025',
            description: '팀 참가 승인 테스트를 위한 경기',
            type: 'round_robin',
            max_participants: 8,
            status: 'registration'
        })
    });

    if (!response.ok) {
        console.error('Failed to create match:', await response.text());
        return;
    }

    const data = await response.json();
    matchId = data.data.id;
    console.log(`✅ 경기 생성 완료: ${data.data.title} (ID: ${matchId})`);
}

// 6. 경기 참가 신청 (captain이 팀으로 신청)
async function requestJoinMatch() {
    console.log('\n6. 경기 참가 신청...');
    
    const response = await fetch(`${API_URL}/matches/${matchId}/participants`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${users.captain.token}`
        },
        body: JSON.stringify({
            notes: '우리 팀이 참가하고 싶습니다!'
        })
    });

    if (!response.ok) {
        console.error('Failed to request join match:', await response.text());
        return;
    }

    const data = await response.json();
    participantId = data.data.id;
    console.log(`✅ 경기 참가 신청 완료 (Participant ID: ${participantId})`);
}

// 7. 경기 참가 승인 (organizer가 승인)
async function approveMatchParticipation() {
    console.log('\n7. 경기 참가 승인...');
    
    const response = await fetch(`${API_URL}/matches/${matchId}/participants/${participantId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${users.organizer.token}`
        },
        body: JSON.stringify({
            status: 'approved',
            reason: '참가를 환영합니다!'
        })
    });

    if (!response.ok) {
        console.error('Failed to approve match participation:', await response.text());
        return;
    }

    const data = await response.json();
    console.log(`✅ 경기 참가 승인 완료: ${data.message}`);
}

// 8. 팀에서 선수 제거 테스트 (captain이 member1 제거)
async function removePlayerFromTeam() {
    console.log('\n8. 팀에서 선수 제거...');
    
    // 먼저 팀의 선수 목록 조회
    const listResponse = await fetch(`${API_URL}/teams/${teamId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${users.captain.token}`
        }
    });

    if (!listResponse.ok) {
        console.error('Failed to get team details:', await listResponse.text());
        return;
    }

    const teamData = await listResponse.json();
    const players = teamData.data.players || [];
    const memberPlayer = players.find(p => p.email === users.member1.email);
    
    if (!memberPlayer) {
        console.log('⚠️ 선수를 찾을 수 없습니다');
        return;
    }

    // 선수 제거
    const response = await fetch(`${API_URL}/teams/${teamId}/players/${memberPlayer.id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${users.captain.token}`
        }
    });

    if (!response.ok) {
        console.error('Failed to remove player:', await response.text());
        return;
    }

    const data = await response.json();
    console.log(`✅ 선수 제거 완료: ${data.message}`);
}

// 9. 팀 탈퇴 테스트 (member2가 스스로 탈퇴)
async function leaveTeam() {
    console.log('\n9. 팀 탈퇴 테스트...');
    
    // 먼저 member2를 팀에 추가
    console.log('   - member2 팀 가입 신청...');
    const joinResponse = await fetch(`${API_URL}/teams/${teamId}/join-requests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${users.member2.token}`
        },
        body: JSON.stringify({
            player_name: 'Member Two',
            player_email: users.member2.email,
            position: 'Defender',
            jersey_number: 5
        })
    });

    if (!joinResponse.ok) {
        console.error('Failed to request join:', await joinResponse.text());
        return;
    }

    const joinData = await joinResponse.json();
    const requestId = joinData.request.id;

    // Captain이 승인
    console.log('   - Captain이 승인...');
    const approveResponse = await fetch(`${API_URL}/teams/${teamId}/join-requests`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${users.captain.token}`
        },
        body: JSON.stringify({
            requestId: requestId,
            status: 'approved'
        })
    });

    if (!approveResponse.ok) {
        console.error('Failed to approve:', await approveResponse.text());
        return;
    }

    // member2가 탈퇴
    console.log('   - member2가 팀 탈퇴...');
    const leaveResponse = await fetch(`${API_URL}/teams/${teamId}/leave`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${users.member2.token}`
        }
    });

    if (!leaveResponse.ok) {
        console.error('Failed to leave team:', await leaveResponse.text());
        return;
    }

    const leaveData = await leaveResponse.json();
    console.log(`✅ 팀 탈퇴 완료: ${leaveData.message}`);
}

// 10. 경기에서 팀 제거 테스트
async function removeTeamFromMatch() {
    console.log('\n10. 경기에서 팀 제거...');
    
    const response = await fetch(`${API_URL}/matches/${matchId}/participants/${participantId}/remove`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${users.organizer.token}`
        },
        body: JSON.stringify({
            reason: '테스트를 위한 제거'
        })
    });

    if (!response.ok) {
        console.error('Failed to remove team from match:', await response.text());
        return;
    }

    const data = await response.json();
    console.log(`✅ 경기에서 팀 제거 완료: ${data.message}`);
}

// 전체 테스트 실행
async function runTests() {
    console.log('====================================');
    console.log('팀 가입 및 경기 참가 프로세스 테스트');
    console.log('====================================');

    try {
        await setupUsers();
        await createTeam();
        await requestJoinTeam();
        await approveJoinRequest();
        await createMatch();
        await requestJoinMatch();
        await approveMatchParticipation();
        await removePlayerFromTeam();  // 순서 변경: 탈퇴 전에 제거
        await leaveTeam();
        await removeTeamFromMatch();

        console.log('\n====================================');
        console.log('✅ 모든 테스트 완료!');
        console.log('====================================');
    } catch (error) {
        console.error('\n❌ 테스트 실행 중 오류:', error);
    }
}

// 테스트 실행
runTests();