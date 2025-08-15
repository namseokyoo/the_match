// 게시글 작성 테스트 스크립트

async function testPostCreation() {
    try {
        // 1. 게시판 목록 확인
        console.log('📋 게시판 목록 확인 중...');
        const boardsResponse = await fetch('http://localhost:3003/api/boards');
        const boardsData = await boardsResponse.json();
        
        if (!boardsResponse.ok) {
            console.error('❌ 게시판 조회 실패:', boardsData);
            return;
        }
        
        console.log('✅ 게시판 목록:', boardsData.boards.map(b => b.name).join(', '));
        
        if (boardsData.boards.length === 0) {
            console.error('❌ 게시판이 없습니다. seed 스크립트를 먼저 실행하세요.');
            return;
        }
        
        // 2. 게시글 작성 테스트 (인증 없이)
        console.log('\n📝 게시글 작성 테스트 (인증 없이)...');
        const firstBoard = boardsData.boards[0];
        
        const postResponse = await fetch('http://localhost:3003/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                board_id: firstBoard.id,
                title: '테스트 게시글',
                content: '이것은 테스트 게시글입니다.',
                tags: ['테스트', 'API']
            })
        });
        
        const postData = await postResponse.json();
        
        if (postResponse.status === 401) {
            console.log('✅ 예상대로 인증 오류 발생:', postData.error);
            console.log('   → 로그인 후 브라우저에서 직접 테스트해주세요.');
        } else if (postResponse.ok) {
            console.log('✅ 게시글 작성 성공:', postData.post);
        } else {
            console.error('❌ 게시글 작성 실패:', postData);
        }
        
        // 3. 게시글 목록 조회 테스트
        console.log('\n📋 게시글 목록 조회 테스트...');
        const postsResponse = await fetch('http://localhost:3003/api/posts');
        const postsData = await postsResponse.json();
        
        if (postsResponse.ok) {
            console.log('✅ 게시글 목록 조회 성공:');
            console.log(`   - 총 게시글 수: ${postsData.posts.length}`);
            console.log(`   - 페이지 정보: ${postsData.pagination.page}/${postsData.pagination.totalPages}`);
        } else {
            console.error('❌ 게시글 목록 조회 실패:', postsData);
        }
        
    } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
    }
}

testPostCreation();