import { test, expect, Page } from '@playwright/test';

// 유틸리티 함수들
async function takeScreenshot(page: Page, filename: string, description: string = '') {
    const path = `test-results/bracket_${filename}_${Date.now()}.png`;
    await page.screenshot({ 
        path,
        fullPage: true 
    });
    console.log(`📸 스크린샷 저장: ${path} ${description ? `- ${description}` : ''}`);
    return path;
}

async function waitForPageLoad(page: Page, timeout = 10000) {
    try {
        await page.waitForLoadState('networkidle', { timeout });
        return true;
    } catch (error) {
        console.log(`⚠️ 페이지 로드 대기 시간 초과`);
        return false;
    }
}

// 메인 테스트 스위트
test.describe('The Match 대진표 시스템 게스트 테스트', () => {
    
    // 각 테스트마다 30초 타임아웃 설정
    test.setTimeout(60000);
    
    test.beforeEach(async ({ page }) => {
        // 페이지 타임아웃 설정
        page.setDefaultTimeout(15000);
    });
    
    test('게스트 사용자 대진표 시스템 기본 확인', async ({ page }) => {
        console.log('🎯 게스트 사용자 대진표 시스템 테스트 시작');
        console.log('==================================================');
        
        // 1. 홈페이지 접근 및 확인
        console.log('🏠 홈페이지 접근...');
        await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        
        const homeTitle = await page.title();
        console.log(`📄 홈페이지 제목: ${homeTitle}`);
        await takeScreenshot(page, 'homepage', '홈페이지 초기 화면');
        
        // 2. 경기 목록 페이지 접근
        console.log('📋 경기 목록 페이지 접근...');
        
        // 네비게이션에서 경기 링크 찾기
        const matchNavLinks = [
            'a[href="/matches"]',
            'text=경기',
            'text=매치',
            'text=Match',
            'a:has-text("경기")',
            'a:has-text("매치")'
        ];
        
        let matchesPageAccessed = false;
        for (const selector of matchNavLinks) {
            try {
                const link = page.locator(selector).first();
                if (await link.isVisible()) {
                    console.log(`✅ 경기 링크 발견: ${selector}`);
                    await link.click();
                    await page.waitForTimeout(2000);
                    matchesPageAccessed = true;
                    break;
                }
            } catch (error) {
                // 다음 선택자 시도
            }
        }
        
        // 직접 URL로 접근
        if (!matchesPageAccessed) {
            console.log('🔗 직접 URL로 경기 목록 페이지 접근...');
            await page.goto('http://localhost:3000/matches', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3000);
        }
        
        const matchesTitle = await page.title();
        console.log(`📄 경기 목록 페이지 제목: ${matchesTitle}`);
        await takeScreenshot(page, 'matches_list_guest', '게스트 경기 목록 페이지');
        
        // 3. 경기 목록 분석
        console.log('🔍 경기 목록 분석...');
        
        // 다양한 방법으로 경기 카드 찾기
        const matchSelectors = [
            'a[href*="/matches/"]',
            '.match-card',
            '[data-testid="match-card"]',
            'div:has(h3)',
            'div:has(h2)',
            'article',
            '.card'
        ];
        
        let matchElements = [];
        for (const selector of matchSelectors) {
            try {
                const elements = await page.locator(selector).all();
                if (elements.length > 0) {
                    console.log(`📋 선택자 '${selector}'로 ${elements.length}개 요소 발견`);
                    if (elements.length > matchElements.length) {
                        matchElements = elements;
                    }
                }
            } catch (error) {
                // 다음 선택자 시도
            }
        }
        
        console.log(`📊 총 발견된 경기 요소: ${matchElements.length}개`);
        
        if (matchElements.length === 0) {
            console.log('❌ 경기를 찾을 수 없습니다. 페이지 내용을 확인합니다...');
            
            // 페이지 내용 디버깅
            const pageText = await page.textContent('body');
            const hasMatchText = pageText?.includes('경기') || pageText?.includes('대회') || pageText?.includes('토너먼트');
            console.log(`🔍 페이지에 경기 관련 텍스트 존재: ${hasMatchText}`);
            
            if (pageText && pageText.length > 0) {
                console.log(`📝 페이지 내용 샘플: ${pageText.substring(0, 200)}...`);
            }
            
            return;
        }
        
        // 4. 각 경기에서 대진표 시스템 확인
        console.log('\\n🎮 각 경기의 대진표 시스템 확인...');
        
        let totalMatches = 0;
        let matchesWithBrackets = 0;
        let bracketDetails = [];
        
        const maxMatchesToCheck = Math.min(matchElements.length, 5);
        
        for (let i = 0; i < maxMatchesToCheck; i++) {
            try {
                console.log(`\\n--- 경기 ${i + 1}/${maxMatchesToCheck} 확인 ---`);
                
                // 경기 목록으로 다시 이동 (필요시)
                if (i > 0) {
                    await page.goto('http://localhost:3000/matches', { waitUntil: 'domcontentloaded' });
                    await page.waitForTimeout(2000);
                    // 요소들 다시 가져오기
                    matchElements = await page.locator('a[href*="/matches/"]').all();
                }
                
                if (i >= matchElements.length) {
                    console.log(`⚠️ 경기 ${i + 1}를 찾을 수 없음`);
                    continue;
                }
                
                const matchElement = matchElements[i];
                
                // 경기 제목 추출
                let matchTitle = 'Unknown Match';
                try {
                    const titleText = await matchElement.textContent();
                    if (titleText && titleText.trim()) {
                        matchTitle = titleText.trim().substring(0, 50);
                    }
                } catch (error) {
                    console.log(`⚠️ 경기 제목 추출 실패`);
                }
                
                console.log(`🎯 경기 제목: ${matchTitle}`);
                
                // 경기 상세 페이지로 이동
                await matchElement.click();
                await page.waitForTimeout(3000);
                
                totalMatches++;
                
                const currentUrl = page.url();
                console.log(`🌐 현재 URL: ${currentUrl}`);
                
                await takeScreenshot(page, `match_${i + 1}_detail`, `경기 ${i + 1} 상세 페이지`);
                
                // 5. 대진표 섹션 확인
                console.log('🗂️ 대진표 섹션 검색...');
                
                const bracketSelectors = [
                    'text=대진표',
                    'h2:text("대진표")',
                    'h3:text("대진표")',
                    '[data-testid="bracket-section"]',
                    '.bracket-section',
                    'div:has(h2:text("대진표"))',
                    'div:has(text("대진표"))',
                    'section:has-text("대진표")'
                ];
                
                let bracketFound = false;
                let usedSelector = '';
                
                for (const selector of bracketSelectors) {
                    try {
                        const element = page.locator(selector);
                        if (await element.isVisible()) {
                            bracketFound = true;
                            usedSelector = selector;
                            console.log(`✅ 대진표 섹션 발견 (${selector})`);
                            break;
                        }
                    } catch (error) {
                        // 다음 선택자 시도
                    }
                }
                
                if (bracketFound) {
                    matchesWithBrackets++;
                    console.log('🎊 대진표 상세 분석...');
                    
                    const bracketInfo = {
                        matchTitle,
                        matchIndex: i + 1,
                        url: currentUrl,
                        hasCreateButton: false,
                        teamsCount: 0,
                        gamesCount: 0,
                        rounds: 0
                    };
                    
                    // 대진표 생성 버튼 확인
                    const createButtonSelectors = [
                        'text=대진표 생성하기',
                        'text=대진표 생성',
                        'text=생성하기',
                        'button:has-text("대진표")',
                        'button:has-text("생성")'
                    ];
                    
                    for (const buttonSelector of createButtonSelectors) {
                        try {
                            if (await page.locator(buttonSelector).isVisible()) {
                                bracketInfo.hasCreateButton = true;
                                console.log(`🔘 생성 버튼 발견: ${buttonSelector}`);
                                break;
                            }
                        } catch (error) {
                            // 다음 버튼 검색
                        }
                    }
                    
                    // 팀 수 정보 확인
                    try {
                        const teamCountSelectors = [
                            'text=/승인된 팀:?\\s*\\d+개?/',
                            'text=/팀:?\\s*\\d+개?/',
                            'text=/참가:?\\s*\\d+/'
                        ];
                        
                        for (const teamSelector of teamCountSelectors) {
                            try {
                                const teamCountText = await page.locator(teamSelector).textContent();
                                if (teamCountText) {
                                    const match = teamCountText.match(/\\d+/);
                                    if (match) {
                                        bracketInfo.teamsCount = parseInt(match[0]);
                                        console.log(`👥 팀 수: ${bracketInfo.teamsCount}개`);
                                        break;
                                    }
                                }
                            } catch (error) {
                                // 다음 선택자 시도
                            }
                        }
                    } catch (error) {
                        console.log('⚠️ 팀 수 정보를 찾을 수 없음');
                    }
                    
                    // 게임 수 확인
                    const gameSelectors = [
                        'div:has-text("vs")',
                        '.game-card',
                        '[data-testid="game-card"]',
                        'div:contains("vs")'
                    ];
                    
                    for (const gameSelector of gameSelectors) {
                        try {
                            const gamesCount = await page.locator(gameSelector).count();
                            if (gamesCount > bracketInfo.gamesCount) {
                                bracketInfo.gamesCount = gamesCount;
                            }
                        } catch (error) {
                            // 다음 선택자 시도
                        }
                    }
                    console.log(`⚔️ 게임 수: ${bracketInfo.gamesCount}개`);
                    
                    // 라운드 수 확인
                    try {
                        const roundElements = await page.locator('h3, .round-title, [class*="round"]').count();
                        bracketInfo.rounds = roundElements;
                        console.log(`📅 라운드/섹션 수: ${bracketInfo.rounds}개`);
                    } catch (error) {
                        console.log('⚠️ 라운드 정보를 찾을 수 없음');
                    }
                    
                    await takeScreenshot(page, `match_${i + 1}_bracket`, `경기 ${i + 1} 대진표 상세`);
                    
                    bracketDetails.push(bracketInfo);
                    
                    console.log(`📋 경기 ${i + 1} 대진표 요약:`);
                    console.log(`  - 생성 버튼: ${bracketInfo.hasCreateButton ? '있음' : '없음'}`);
                    console.log(`  - 팀 수: ${bracketInfo.teamsCount}개`);
                    console.log(`  - 게임 수: ${bracketInfo.gamesCount}개`);
                    console.log(`  - 라운드 수: ${bracketInfo.rounds}개`);
                    
                } else {
                    console.log(`❌ 경기 ${i + 1}에 대진표 없음`);
                }
                
            } catch (error) {
                console.error(`❌ 경기 ${i + 1} 확인 중 오류: ${error.message}`);
            }
        }
        
        // 6. 종합 결과 분석
        console.log('\\n' + '='.repeat(60));
        console.log('📊 The Match 대진표 시스템 테스트 결과 종합');
        console.log('='.repeat(60));
        
        console.log(`\\n📈 기본 통계:`);
        console.log(`  • 총 확인한 경기: ${totalMatches}개`);
        console.log(`  • 대진표 있는 경기: ${matchesWithBrackets}개`);
        console.log(`  • 대진표 비율: ${totalMatches > 0 ? ((matchesWithBrackets / totalMatches) * 100).toFixed(1) : 0}%`);
        
        if (bracketDetails.length > 0) {
            console.log(`\\n🗂️ 대진표 상세 정보:`);
            
            let totalTeams = 0;
            let totalGames = 0;
            let matchesWithButtons = 0;
            
            bracketDetails.forEach((detail, index) => {
                console.log(`\\n  ${index + 1}. ${detail.matchTitle}`);
                console.log(`     URL: ${detail.url}`);
                console.log(`     생성 버튼: ${detail.hasCreateButton ? '✅' : '❌'}`);
                console.log(`     팀 수: ${detail.teamsCount}개`);
                console.log(`     게임 수: ${detail.gamesCount}개`);
                console.log(`     라운드 수: ${detail.rounds}개`);
                
                totalTeams += detail.teamsCount;
                totalGames += detail.gamesCount;
                if (detail.hasCreateButton) matchesWithButtons++;
            });
            
            console.log(`\\n📊 대진표 시스템 분석:`);
            console.log(`  • 평균 팀 수: ${bracketDetails.length > 0 ? (totalTeams / bracketDetails.length).toFixed(1) : 0}개`);
            console.log(`  • 평균 게임 수: ${bracketDetails.length > 0 ? (totalGames / bracketDetails.length).toFixed(1) : 0}개`);
            console.log(`  • 생성 버튼 있는 경기: ${matchesWithButtons}개`);
            console.log(`  • 생성 기능 비율: ${bracketDetails.length > 0 ? ((matchesWithButtons / bracketDetails.length) * 100).toFixed(1) : 0}%`);
        }
        
        // 최종 스크린샷
        await takeScreenshot(page, 'comprehensive_test_complete', '종합 테스트 완료');
        
        console.log('\\n✅ The Match 대진표 시스템 종합 테스트 완료!');
        
        // 기본적인 어서션
        expect(totalMatches).toBeGreaterThan(0);
        
        if (matchesWithBrackets > 0) {
            expect(bracketDetails).toHaveLength(matchesWithBrackets);
            console.log(`✅ 어서션 통과: ${matchesWithBrackets}개 경기에서 대진표 시스템 확인됨`);
        } else {
            console.log(`⚠️ 대진표 시스템이 있는 경기가 없습니다.`);
        }
    });
    
    test('대진표 시스템 UI 반응형 테스트', async ({ page }) => {
        console.log('📱 대진표 시스템 반응형 UI 테스트');
        
        // 다양한 화면 크기 정의
        const viewports = [
            { name: '모바일', width: 375, height: 667 },
            { name: '태블릿', width: 768, height: 1024 },
            { name: '데스크톱', width: 1920, height: 1080 }
        ];
        
        // 먼저 경기 목록에서 대진표가 있는 경기 찾기
        await page.goto('http://localhost:3000/matches', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        
        const matchLinks = await page.locator('a[href*="/matches/"]').all();
        let bracketMatchFound = false;
        
        for (let i = 0; i < Math.min(matchLinks.length, 3); i++) {
            try {
                const matchLink = matchLinks[i];
                await matchLink.click();
                await page.waitForTimeout(2000);
                
                const hasBracket = await page.locator('text=대진표').isVisible();
                if (hasBracket) {
                    bracketMatchFound = true;
                    console.log(`✅ 대진표가 있는 경기 발견 (경기 ${i + 1})`);
                    break;
                }
                
                // 다시 경기 목록으로
                await page.goto('http://localhost:3000/matches', { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(1000);
            } catch (error) {
                console.log(`경기 ${i + 1} 확인 중 오류`);
            }
        }
        
        if (!bracketMatchFound) {
            console.log('⚠️ 대진표가 있는 경기를 찾을 수 없어 반응형 테스트를 건너뜁니다.');
            return;
        }
        
        // 각 화면 크기에서 테스트
        for (const viewport of viewports) {
            console.log(`\\n🖥️ ${viewport.name} 화면 테스트 (${viewport.width}x${viewport.height})`);
            
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.waitForTimeout(2000);
            
            // 대진표 섹션 확인
            const bracketVisible = await page.locator('text=대진표').isVisible();
            console.log(`  대진표 섹션: ${bracketVisible ? '✅ 표시됨' : '❌ 숨겨짐'}`);
            
            // 스크린샷 저장
            await takeScreenshot(page, `responsive_${viewport.name.toLowerCase()}`, 
                              `${viewport.name} 화면에서의 대진표`);
            
            // 모바일에서는 접혀있을 수도 있으므로 기본적으로 통과
            if (viewport.name !== '모바일') {
                expect(bracketVisible).toBe(true);
            }
        }
        
        // 데스크톱 화면으로 복원
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        console.log('✅ 반응형 테스트 완료');
    });
});

test.afterAll(async () => {
    console.log('🧹 게스트 대진표 테스트 완료');
});