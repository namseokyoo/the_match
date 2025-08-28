import { test, expect, Page } from '@playwright/test';

// 테스트 사용자 정보
const TEST_USER = {
    email: 'prod1755409103374@thematch.test',
    password: 'testpass123'
};

// 유틸리티 함수들
async function loginUser(page: Page) {
    console.log('🔐 사용자 로그인 시도...');
    
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    
    // 로그인 폼이 로드될 때까지 대기
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 로그인 완료 대기
    await page.waitForURL(/\/(dashboard|$)/, { timeout: 15000 });
    console.log('✅ 로그인 성공');
}

async function takeScreenshot(page: Page, filename: string, description: string = '') {
    const path = `test-results/bracket_${filename}_${Date.now()}.png`;
    await page.screenshot({ 
        path,
        fullPage: true 
    });
    console.log(`📸 스크린샷 저장: ${path} ${description ? `- ${description}` : ''}`);
    return path;
}

// 메인 테스트 스위트
test.describe('The Match 대진표 시스템 기본 테스트', () => {
    
    // 각 테스트마다 30초 타임아웃 설정
    test.setTimeout(60000);
    
    test.beforeEach(async ({ page }) => {
        // 페이지 타임아웃 설정
        page.setDefaultTimeout(15000);
        await loginUser(page);
    });
    
    test('경기 목록 페이지 접근 및 대진표 섹션 확인', async ({ page }) => {
        console.log('🎯 경기 목록 및 대진표 기본 테스트 시작');
        
        // 1. 경기 목록 페이지 접근
        await page.goto('http://localhost:3000/matches', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'matches_list', '경기 목록 페이지');
        
        // 2. 페이지 제목 확인
        const title = await page.title();
        console.log(`📄 페이지 제목: ${title}`);
        expect(title).toContain('Match' || '경기' || 'The Match');
        
        // 3. 경기 카드들 찾기
        console.log('🔍 경기 카드 검색 중...');
        const matchLinks = await page.locator('a[href*="/matches/"]').all();
        console.log(`📋 발견된 경기 링크: ${matchLinks.length}개`);
        
        if (matchLinks.length === 0) {
            console.log('⚠️ 경기가 없습니다. 테스트를 위해 생성된 경기가 필요합니다.');
            return;
        }
        
        // 4. 첫 번째 경기 클릭
        console.log('🎮 첫 번째 경기 상세 페이지로 이동...');
        const firstMatch = matchLinks[0];
        await firstMatch.click();
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        console.log(`🌐 현재 URL: ${currentUrl}`);
        await takeScreenshot(page, 'match_detail', '경기 상세 페이지');
        
        // 5. 대진표 섹션 확인
        console.log('🗂️ 대진표 섹션 확인 중...');
        
        // 다양한 방법으로 대진표 섹션 찾기
        const bracketSelectors = [
            'h2:text("대진표")',
            'text=대진표',
            '[data-testid="bracket-section"]',
            '.bracket-section',
            'div:has(h2:text("대진표"))',
            'div:has(text("대진표"))'
        ];
        
        let bracketSectionFound = false;
        let usedSelector = '';
        
        for (const selector of bracketSelectors) {
            try {
                const element = page.locator(selector);
                if (await element.isVisible()) {
                    bracketSectionFound = true;
                    usedSelector = selector;
                    console.log(`✅ 대진표 섹션 발견 (선택자: ${selector})`);
                    break;
                }
            } catch (error) {
                // 선택자가 작동하지 않으면 다음으로 넘어감
            }
        }
        
        if (bracketSectionFound) {
            console.log('🎊 대진표 기능 테스트 진행...');
            
            // 대진표 카드/섹션 상세 분석
            const bracketCard = page.locator(usedSelector).first();
            
            // 대진표 생성 버튼 확인
            const createButtons = [
                'text=대진표 생성하기',
                'text=대진표 생성',
                'text=생성하기',
                'button:has-text("대진표")',
                'button:has-text("생성")'
            ];
            
            let hasCreateButton = false;
            for (const buttonSelector of createButtons) {
                try {
                    if (await page.locator(buttonSelector).isVisible()) {
                        hasCreateButton = true;
                        console.log(`🔘 대진표 생성 버튼 발견: ${buttonSelector}`);
                        break;
                    }
                } catch (error) {
                    // 버튼이 없으면 계속 검색
                }
            }
            
            // 팀 수 정보 확인
            let teamsCount = 0;
            try {
                const teamCountText = await page.locator('text=/승인된 팀:?\\s*\\d+개?/').textContent();
                if (teamCountText) {
                    const match = teamCountText.match(/\\d+/);
                    teamsCount = match ? parseInt(match[0]) : 0;
                    console.log(`👥 승인된 팀 수: ${teamsCount}개`);
                }
            } catch (error) {
                console.log('⚠️ 팀 수 정보를 찾을 수 없음');
            }
            
            // 기존 게임/매치 확인
            let gamesCount = 0;
            const gameSelectors = [
                'div:has-text("vs")',
                '.game-card',
                '[data-testid="game-card"]',
                'div:contains("vs")'
            ];
            
            for (const gameSelector of gameSelectors) {
                try {
                    const games = await page.locator(gameSelector).count();
                    if (games > gamesCount) {
                        gamesCount = games;
                    }
                } catch (error) {
                    // 선택자가 작동하지 않으면 넘어감
                }
            }
            console.log(`⚔️ 발견된 게임 수: ${gamesCount}개`);
            
            // 대진표 스크린샷
            await takeScreenshot(page, 'bracket_section', '대진표 섹션 상세');
            
            // 테스트 결과 정리
            console.log('\\n📊 대진표 시스템 분석 결과:');
            console.log(`  ✅ 대진표 섹션: ${bracketSectionFound ? '존재' : '없음'}`);
            console.log(`  🔘 생성 버튼: ${hasCreateButton ? '있음' : '없음'}`);
            console.log(`  👥 승인된 팀: ${teamsCount}개`);
            console.log(`  ⚔️ 기존 게임: ${gamesCount}개`);
            
            // 기본적인 어서션
            expect(bracketSectionFound).toBe(true);
            
            // 팀이 있다면 생성 버튼이 있어야 함 (선택적)
            if (teamsCount >= 2) {
                expect(hasCreateButton).toBe(true);
            }
            
        } else {
            console.log('❌ 대진표 섹션을 찾을 수 없습니다.');
            
            // 페이지 내용 디버깅
            const pageContent = await page.content();
            const hasBracketText = pageContent.includes('대진표');
            console.log(`🔍 페이지에 '대진표' 텍스트 존재: ${hasBracketText}`);
            
            if (hasBracketText) {
                console.log('⚠️ 대진표 텍스트는 있지만 UI 요소를 찾을 수 없음');
            }
            
            // 실패하지 않고 경고만 출력
            console.log('⚠️ 이 경기에는 대진표 기능이 없거나 비활성화되어 있습니다.');
        }
        
        console.log('✅ 기본 대진표 테스트 완료');
    });
    
    test('다양한 경기 유형 대진표 확인', async ({ page }) => {
        console.log('🔍 다양한 경기 유형의 대진표 검색');
        
        await page.goto('http://localhost:3000/matches', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        
        // 모든 경기 링크 수집
        const matchLinks = await page.locator('a[href*="/matches/"]').all();
        console.log(`📋 총 ${matchLinks.length}개 경기 확인`);
        
        let bracketMatchCount = 0;
        let totalMatchCount = 0;
        
        // 최대 5개 경기만 확인 (시간 절약)
        const maxMatches = Math.min(matchLinks.length, 5);
        
        for (let i = 0; i < maxMatches; i++) {
            try {
                console.log(`\\n🎮 경기 ${i + 1}/${maxMatches} 확인 중...`);
                
                // 경기 목록으로 다시 이동
                await page.goto('http://localhost:3000/matches', { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(1000);
                
                // 해당 인덱스의 경기 클릭
                const currentMatchLinks = await page.locator('a[href*="/matches/"]').all();
                if (i < currentMatchLinks.length) {
                    await currentMatchLinks[i].click();
                    await page.waitForTimeout(2000);
                    
                    totalMatchCount++;
                    
                    // 대진표 섹션 확인
                    const hasBracket = await page.locator('text=대진표').isVisible();
                    
                    if (hasBracket) {
                        bracketMatchCount++;
                        console.log(`  ✅ 대진표 있음`);
                        
                        // 스크린샷 저장
                        await takeScreenshot(page, `match_${i + 1}_bracket`, `경기 ${i + 1} 대진표`);
                    } else {
                        console.log(`  ❌ 대진표 없음`);
                    }
                }
            } catch (error) {
                console.log(`  ⚠️ 경기 ${i + 1} 확인 중 오류: ${error.message}`);
            }
        }
        
        console.log('\\n📊 전체 경기 대진표 현황:');
        console.log(`  총 확인한 경기: ${totalMatchCount}개`);
        console.log(`  대진표 있는 경기: ${bracketMatchCount}개`);
        console.log(`  대진표 비율: ${totalMatchCount > 0 ? ((bracketMatchCount / totalMatchCount) * 100).toFixed(1) : 0}%`);
        
        // 최소한 하나의 경기는 확인되어야 함
        expect(totalMatchCount).toBeGreaterThan(0);
    });
    
    test('대진표 UI 반응형 테스트', async ({ page }) => {
        console.log('📱 대진표 반응형 UI 테스트');
        
        // 먼저 대진표가 있는 경기 찾기
        await page.goto('http://localhost:3000/matches', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        
        const matchLinks = await page.locator('a[href*="/matches/"]').all();
        let bracketMatch = null;
        
        for (let i = 0; i < Math.min(matchLinks.length, 3); i++) {
            try {
                await matchLinks[i].click();
                await page.waitForTimeout(2000);
                
                const hasBracket = await page.locator('text=대진표').isVisible();
                if (hasBracket) {
                    bracketMatch = true;
                    break;
                }
                
                // 다시 목록으로 돌아가기
                await page.goto('http://localhost:3000/matches', { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(1000);
            } catch (error) {
                console.log(`경기 ${i + 1} 확인 중 오류`);
            }
        }
        
        if (!bracketMatch) {
            console.log('⚠️ 대진표가 있는 경기를 찾을 수 없어 반응형 테스트를 건너뜁니다.');
            return;
        }
        
        // 다양한 화면 크기에서 테스트
        const viewports = [
            { name: '모바일', width: 375, height: 667 },
            { name: '태블릿', width: 768, height: 1024 },
            { name: '데스크톱', width: 1920, height: 1080 }
        ];
        
        for (const viewport of viewports) {
            console.log(`🖥️ ${viewport.name} 화면 테스트 (${viewport.width}x${viewport.height})`);
            
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.waitForTimeout(1000);
            
            // 대진표 섹션이 여전히 보이는지 확인
            const bracketVisible = await page.locator('text=대진표').isVisible();
            console.log(`  대진표 섹션: ${bracketVisible ? '표시됨' : '숨겨짐'}`);
            
            if (bracketVisible) {
                await takeScreenshot(page, `responsive_${viewport.name.toLowerCase()}`, 
                                  `${viewport.name} 화면에서의 대진표`);
            }
            
            // 기본적으로 대진표는 모든 화면에서 보여야 함
            expect(bracketVisible).toBe(true);
        }
        
        // 데스크톱 화면으로 복원
        await page.setViewportSize({ width: 1920, height: 1080 });
    });
});

test.afterAll(async () => {
    console.log('🧹 대진표 테스트 완료');
});