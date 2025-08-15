// 게시판 데이터 초기화 스크립트
// 사용법: node scripts/seed-boards.js

async function seedBoards() {
    try {
        // 개발 서버가 실행 중이어야 합니다
        const response = await fetch('http://localhost:3003/api/boards/seed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ 게시판 생성 완료:', data);
            console.log(`- 새로 생성된 게시판: ${data.created}개`);
            console.log(`- 이미 존재하는 게시판: ${data.skipped}개`);
        } else {
            console.error('❌ 게시판 생성 실패:', data);
        }

        // 현재 게시판 목록 확인
        const checkResponse = await fetch('http://localhost:3003/api/boards/seed');
        const checkData = await checkResponse.json();
        
        if (checkResponse.ok) {
            console.log('\n📋 현재 게시판 목록:');
            checkData.boards.forEach(board => {
                console.log(`  - ${board.name} (${board.slug})`);
            });
        }
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        console.log('개발 서버가 실행 중인지 확인해주세요 (npm run dev)');
    }
}

seedBoards();