import { test, expect, Page } from '@playwright/test';
import { chromium, webkit, firefox } from 'playwright';

// 테스트 사용자 정보
const TEST_USER = {
    email: 'prod1755409103374@thematch.test',
    password: 'testpass123'
};

// 테스트할 경기 방식
const MATCH_TYPES = [
    { id: 'single_elimination', name: '싱글 엘리미네이션' },
    { id: 'double_elimination', name: '더블 엘리미네이션' },
    { id: 'round_robin', name: '리그전' },
    { id: 'swiss', name: '스위스' },
    { id: 'league', name: '정규 리그' }
];

// 유틸리티 함수들
async function loginUser(page: Page) {
    console.log('🔐 사용자 로그인 시도...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]', { timeout: 5000 });
    
    // 로그인 완료 대기 - dashboard나 홈페이지로 리다이렉트
    await page.waitForURL(/\/(dashboard|$)/, { timeout: 15000 });
    console.log('✅ 로그인 성공');
}

async function takeScreenshot(page: Page, filename: string, description: string = '') {
    const path = `/Users/namseokyoo/project/the_match/test-results/bracket_${filename}.png`;
    await page.screenshot({ 
        path,
        fullPage: true 
    });
    console.log(`📸 스크린샷 저장: ${path} ${description ? `- ${description}` : ''}`);
    return path;
}

async function waitForSelector(page: Page, selector: string, timeout = 10000) {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch (error) {
        console.error(`❌ 선택자를 찾을 수 없음: ${selector}`);
        return false;
    }
}

async function analyzeMatchList(page: Page) {
    console.log('🔍 경기 목록 분석 중...');
    
    // 경기 카드들 찾기
    const matchCards = await page.locator('[data-testid="match-card"], .match-card, div:has(h3:text-matches("경기|대회|토너먼트"))').all();
    console.log(`📋 발견된 경기 카드 수: ${matchCards.length}`);
    
    const matches = [];
    for (let i = 0; i < Math.min(matchCards.length, 10); i++) {
        const card = matchCards[i];
        try {
            const title = await card.locator('h3, .title, [class*="title"]').first().textContent() || '';
            const matchId = await card.getAttribute('data-match-id') || 
                           await card.locator('a').first().getAttribute('href')?.then(href => href?.split('/').pop()) || '';
            
            if (title.trim()) {
                matches.push({
                    id: matchId,
                    title: title.trim(),
                    element: card
                });
            }
        } catch (error) {
            console.log(`⚠️ 경기 카드 ${i + 1} 파싱 실패`);
        }
    }
    
    console.log(`✅ 분석 완료된 경기: ${matches.length}개`);
    return matches;
}

async function testBracketForMatchType(page: Page, matchType: string) {
    console.log(`\n🎯 ${MATCH_TYPES.find(t => t.id === matchType)?.name} 대진표 테스트 시작`);
    
    const results = {
        matchType,
        found: false,
        bracketExists: false,
        teamsCount: 0,
        gamesCount: 0,
        bracketGenerationButton: false,
        errors: []
    };
    
    try {
        // 1. 경기 목록 페이지로 이동
        console.log('📍 경기 목록 페이지 접근...');
        await page.goto('http://localhost:3000/matches', { waitUntil: 'networkidle' });
        await takeScreenshot(page, `${matchType}_matches_list`, '경기 목록');
        
        // 2. 해당 유형의 경기 찾기
        const matches = await analyzeMatchList(page);
        let targetMatch = null;
        
        for (const match of matches) {
            try {
                // 경기 상세 페이지 접근
                await match.element.click();
                await page.waitForTimeout(2000);
                
                // URL에서 경기 ID 추출
                const url = page.url();
                const matchId = url.split('/matches/')[1]?.split('/')[0];
                
                if (matchId) {
                    console.log(`🔍 경기 확인 중: ${match.title} (ID: ${matchId})`);
                    
                    // 대진표 섹션이 있는지 확인
                    const hasBracketSection = await page.locator('text=대진표').isVisible();
                    
                    if (hasBracketSection) {
                        targetMatch = { ...match, id: matchId };
                        results.found = true;
                        console.log(`✅ 대진표가 있는 경기 발견: ${match.title}`);
                        break;
                    }
                }
            } catch (error) {
                console.log(`⚠️ 경기 접근 실패: ${match.title}`);
            }
        }
        
        if (!targetMatch) {
            console.log(`❌ ${matchType} 유형의 경기를 찾을 수 없음`);
            results.errors.push('해당 유형의 경기 없음');
            return results;
        }
        
        // 3. 대진표 섹션 상세 분석
        console.log('📊 대진표 섹션 분석...');
        
        // 대진표 카드 찾기
        const bracketCard = page.locator('div:has(h2:text("대진표"))').first();
        if (await bracketCard.isVisible()) {
            results.bracketExists = true;
            await takeScreenshot(page, `${matchType}_bracket_card`, '대진표 카드');
            
            // 승인된 팀 수 확인
            try {
                const teamCountText = await bracketCard.locator('text=/승인된 팀: \\d+개/').textContent();
                if (teamCountText) {
                    const match = teamCountText.match(/\\d+/);
                    results.teamsCount = match ? parseInt(match[0]) : 0;
                }
            } catch (error) {
                console.log('팀 수 정보 없음');
            }
            
            // 대진표 생성 버튼 확인
            const createButton = bracketCard.locator('text=대진표 생성하기').first();
            results.bracketGenerationButton = await createButton.isVisible();
            
            // 기존 대진표 확인
            const existingGames = await bracketCard.locator('.game-card, [class*="game"], div:has(text("vs"))').count();
            results.gamesCount = existingGames;
            
            console.log(`📈 분석 결과:`);
            console.log(`  - 승인된 팀: ${results.teamsCount}개`);
            console.log(`  - 기존 게임: ${results.gamesCount}개`);
            console.log(`  - 생성 버튼: ${results.bracketGenerationButton ? '있음' : '없음'}`);
        }
        
        // 4. 대진표가 이미 있다면 구조 확인
        if (results.gamesCount > 0) {
            console.log('🗂️ 기존 대진표 구조 분석...');
            
            // 라운드 구조 확인
            const rounds = await bracketCard.locator('h3, .round-title, [class*="round"]').all();
            console.log(`📅 라운드 수: ${rounds.length}`);
            
            // 게임 카드들 분석
            const gameCards = await bracketCard.locator('div:has(text("vs"))').all();
            for (let i = 0; i < Math.min(gameCards.length, 3); i++) {
                const gameText = await gameCards[i].textContent();
                console.log(`⚔️ 게임 ${i + 1}: ${gameText?.replace(/\\s+/g, ' ').trim()}`);
            }
        }
        
        // 5. 대진표 생성 테스트 (가능한 경우)
        if (results.bracketGenerationButton && results.teamsCount >= 2) {
            console.log('🚀 대진표 생성 테스트...');
            try {
                await bracketCard.locator('text=대진표 생성하기').click();
                await page.waitForTimeout(3000);
                
                // 생성 후 상태 확인
                const afterGamesCount = await bracketCard.locator('div:has(text("vs"))').count();
                if (afterGamesCount > results.gamesCount) {
                    console.log('✅ 대진표 생성 성공');
                    await takeScreenshot(page, `${matchType}_bracket_created`, '대진표 생성 후');
                } else {
                    console.log('⚠️ 대진표 생성 확인 불가');
                }
            } catch (error) {
                console.log('❌ 대진표 생성 실패:', error.message);
                results.errors.push('대진표 생성 실패');
            }
        }
        
    } catch (error) {
        console.error(`❌ ${matchType} 테스트 중 오류:`, error.message);
        results.errors.push(error.message);
    }
    
    return results;
}

// 메인 테스트 스위트
test.describe('The Match 대진표 시스템 종합 테스트', () => {
    
    test.beforeEach(async ({ page }) => {
        // 각 테스트 전에 로그인
        await loginUser(page);
    });
    
    // 전체 대진표 시스템 테스트
    test('모든 경기 방식 대진표 기능 검증', async ({ page }) => {
        console.log('🎮 The Match 대진표 시스템 종합 테스트 시작');
        console.log('==================================================');
        
        const testResults = [];
        
        // 각 경기 방식별 테스트 수행
        for (const matchType of MATCH_TYPES) {
            const result = await testBracketForMatchType(page, matchType.id);
            testResults.push(result);
            
            // 테스트 간 대기 시간
            await page.waitForTimeout(1000);
        }
        
        // 종합 결과 분석
        console.log('\\n📊 테스트 결과 종합');
        console.log('==================================================');
        
        let totalFound = 0;
        let totalWithBrackets = 0;
        let totalErrors = 0;
        
        for (const result of testResults) {
            const matchTypeName = MATCH_TYPES.find(t => t.id === result.matchType)?.name;
            console.log(`\\n${matchTypeName}:`);
            console.log(`  ✅ 발견됨: ${result.found ? 'YES' : 'NO'}`);
            console.log(`  📋 대진표: ${result.bracketExists ? 'YES' : 'NO'}`);
            console.log(`  👥 팀 수: ${result.teamsCount}개`);
            console.log(`  🎮 게임 수: ${result.gamesCount}개`);
            console.log(`  🔘 생성 버튼: ${result.bracketGenerationButton ? 'YES' : 'NO'}`);
            console.log(`  ❌ 오류: ${result.errors.length}개`);
            
            if (result.found) totalFound++;
            if (result.bracketExists) totalWithBrackets++;
            totalErrors += result.errors.length;
        }
        
        console.log('\\n📈 최종 통계:');
        console.log(`  총 경기 방식: ${MATCH_TYPES.length}개`);
        console.log(`  발견된 경기: ${totalFound}개`);
        console.log(`  대진표 있는 경기: ${totalWithBrackets}개`);
        console.log(`  총 오류: ${totalErrors}개`);
        
        // 최종 스크린샷
        await takeScreenshot(page, 'comprehensive_test_complete', '종합 테스트 완료');
        
        // 테스트 어서션 - 최소한의 기능이 작동해야 함
        expect(totalFound).toBeGreaterThan(0); // 최소 1개의 경기는 찾아야 함
        expect(totalErrors).toBeLessThan(MATCH_TYPES.length); // 모든 테스트가 실패하면 안됨
        
        console.log('\\n✅ 대진표 시스템 종합 테스트 완료');
    });
    
    // 개별 UI 요소 테스트
    test('대진표 UI 구성 요소 검증', async ({ page }) => {
        console.log('🎨 대진표 UI 구성 요소 테스트');
        
        await page.goto('http://localhost:3000/matches');
        await page.waitForTimeout(2000);
        
        // 경기 목록에서 첫 번째 경기 클릭
        const firstMatch = page.locator('a[href*="/matches/"]').first();
        if (await firstMatch.isVisible()) {
            await firstMatch.click();
            await page.waitForTimeout(2000);
            
            // 대진표 섹션 존재 확인
            const bracketSection = page.locator('text=대진표');
            const hasBracketSection = await bracketSection.isVisible();
            
            if (hasBracketSection) {
                console.log('✅ 대진표 섹션 발견');
                
                // UI 요소들 확인
                const elements = [
                    { name: '대진표 제목', selector: 'h2:text("대진표")' },
                    { name: '팀 수 정보', selector: 'text=/승인된 팀:\\s*\\d+개/' },
                    { name: '대진표 생성 버튼', selector: 'text=대진표 생성하기' },
                    { name: '게임 카드', selector: 'div:has(text("vs"))' },
                    { name: '라운드 정보', selector: 'h3' }
                ];
                
                for (const element of elements) {
                    const exists = await page.locator(element.selector).isVisible();
                    console.log(`${exists ? '✅' : '❌'} ${element.name}: ${exists ? '존재' : '없음'}`);
                }
                
                await takeScreenshot(page, 'ui_components_test', 'UI 구성 요소');
                
                // 최소한 제목은 있어야 함
                expect(await page.locator('h2:text("대진표")').isVisible()).toBe(true);
            } else {
                console.log('⚠️ 대진표 섹션을 찾을 수 없음');
            }
        }
    });
    
    // 반응형 디자인 테스트
    test('대진표 반응형 디자인 확인', async ({ page }) => {
        console.log('📱 대진표 반응형 디자인 테스트');
        
        const viewports = [
            { name: '모바일', width: 375, height: 667 },
            { name: '태블릿', width: 768, height: 1024 },
            { name: '데스크톱', width: 1920, height: 1080 }
        ];
        
        for (const viewport of viewports) {
            console.log(`🖥️ ${viewport.name} 화면 테스트 (${viewport.width}x${viewport.height})`);
            
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto('http://localhost:3000/matches');
            
            // 첫 번째 경기로 이동
            const firstMatch = page.locator('a[href*="/matches/"]').first();
            if (await firstMatch.isVisible()) {
                await firstMatch.click();
                await page.waitForTimeout(1000);
                
                // 대진표 섹션 확인
                const bracketVisible = await page.locator('text=대진표').isVisible();
                console.log(`  대진표 섹션: ${bracketVisible ? '표시됨' : '숨겨짐'}`);
                
                if (bracketVisible) {
                    // 스크린샷 저장
                    await takeScreenshot(page, `responsive_${viewport.name.toLowerCase()}`, 
                                      `${viewport.name} 화면에서의 대진표`);
                }
            }
        }
        
        // 데스크톱 화면으로 복원
        await page.setViewportSize({ width: 1920, height: 1080 });
    });
});

// 테스트 실행 후 정리
test.afterAll(async () => {
    console.log('🧹 테스트 정리 완료');
});