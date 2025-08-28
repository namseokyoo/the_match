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

test.describe('The Match 대진표 시스템 직접 테스트', () => {
    
    test.setTimeout(30000);
    
    test('경기 목록에서 개별 경기 직접 확인', async ({ page }) => {
        console.log('🎯 개별 경기 대진표 직접 확인 테스트');
        
        // 1. 경기 목록 페이지 접근
        await page.goto('http://localhost:3000/matches', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        await takeScreenshot(page, 'matches_list_start', '경기 목록 페이지');
        
        // 2. 페이지의 모든 링크 수집
        const allLinks = await page.locator('a').all();
        const matchLinks = [];
        
        console.log(`🔍 페이지에서 총 ${allLinks.length}개 링크 발견`);
        
        for (let i = 0; i < allLinks.length; i++) {
            try {
                const href = await allLinks[i].getAttribute('href');
                if (href && href.includes('/matches/') && href !== '/matches') {
                    matchLinks.push({
                        href,
                        element: allLinks[i],
                        text: (await allLinks[i].textContent())?.trim().substring(0, 50) || 'Unknown'
                    });
                }
            } catch (error) {
                // 링크 처리 중 오류 무시
            }
        }
        
        console.log(`📋 경기 관련 링크 ${matchLinks.length}개 발견:`);
        matchLinks.forEach((link, index) => {
            console.log(`  ${index + 1}. ${link.href} - ${link.text}`);
        });
        
        if (matchLinks.length === 0) {
            console.log('❌ 경기 링크를 찾을 수 없습니다.');
            return;
        }
        
        // 3. 각 경기 직접 확인
        const maxMatches = Math.min(matchLinks.length, 3);
        const results = [];
        
        for (let i = 0; i < maxMatches; i++) {
            const matchLink = matchLinks[i];
            console.log(`\\n--- 경기 ${i + 1}: ${matchLink.text} ---`);
            
            try {
                // 직접 URL로 이동
                await page.goto(`http://localhost:3000${matchLink.href}`, { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(3000);
                
                const url = page.url();
                console.log(`🌐 현재 URL: ${url}`);
                
                await takeScreenshot(page, `match_${i + 1}_page`, `경기 ${i + 1} 상세 페이지`);
                
                // 페이지 제목 확인
                const title = await page.title();
                console.log(`📄 페이지 제목: ${title}`);
                
                // 대진표 관련 요소 확인
                const bracketElements = {
                    title: await page.locator('text=대진표').isVisible(),
                    section: await page.locator('h2:text("대진표")').isVisible(),
                    card: await page.locator('div:has(h2:text("대진표"))').isVisible(),
                    createButton: false,
                    teams: 0,
                    games: 0
                };
                
                console.log(`🗂️ 대진표 요소 확인:`);
                console.log(`  - 대진표 텍스트: ${bracketElements.title ? '✅' : '❌'}`);
                console.log(`  - 대진표 섹션: ${bracketElements.section ? '✅' : '❌'}`);
                console.log(`  - 대진표 카드: ${bracketElements.card ? '✅' : '❌'}`);
                
                // 대진표가 있으면 상세 분석
                if (bracketElements.title || bracketElements.section || bracketElements.card) {
                    console.log('🎊 대진표 발견! 상세 분석 중...');
                    
                    // 생성 버튼 확인
                    const createButtons = [
                        'text=대진표 생성하기',
                        'text=대진표 생성',
                        'button:has-text("생성")',
                        'button:has-text("대진표")'
                    ];
                    
                    for (const buttonSelector of createButtons) {
                        try {
                            if (await page.locator(buttonSelector).isVisible()) {
                                bracketElements.createButton = true;
                                console.log(`  - 생성 버튼: ✅ (${buttonSelector})`);
                                break;
                            }
                        } catch (error) {
                            // 버튼 없음
                        }
                    }
                    
                    if (!bracketElements.createButton) {
                        console.log(`  - 생성 버튼: ❌`);
                    }
                    
                    // 팀 수 확인
                    try {
                        const teamTexts = [
                            'text=/승인된 팀:?\\s*\\d+개?/',
                            'text=/팀:?\\s*\\d+/',
                            'text=/참가.*\\d+/'
                        ];
                        
                        for (const teamSelector of teamTexts) {
                            try {
                                const teamText = await page.locator(teamSelector).textContent();
                                if (teamText) {
                                    const match = teamText.match(/\\d+/);
                                    if (match) {
                                        bracketElements.teams = parseInt(match[0]);
                                        console.log(`  - 팀 수: ${bracketElements.teams}개`);
                                        break;
                                    }
                                }
                            } catch (error) {
                                // 다음 선택자 시도
                            }
                        }
                    } catch (error) {
                        console.log(`  - 팀 수: 확인 불가`);
                    }
                    
                    // 게임 수 확인
                    try {
                        const gameSelectors = [
                            'div:has-text("vs")',
                            '.game-card',
                            '[class*="game"]',
                            'div:contains("vs")'
                        ];
                        
                        for (const gameSelector of gameSelectors) {
                            try {
                                const count = await page.locator(gameSelector).count();
                                if (count > bracketElements.games) {
                                    bracketElements.games = count;
                                }
                            } catch (error) {
                                // 다음 선택자 시도
                            }
                        }
                        console.log(`  - 게임 수: ${bracketElements.games}개`);
                    } catch (error) {
                        console.log(`  - 게임 수: 확인 불가`);
                    }
                    
                    // 대진표 스크린샷
                    await takeScreenshot(page, `match_${i + 1}_bracket_detail`, `경기 ${i + 1} 대진표 상세`);
                }
                
                results.push({
                    index: i + 1,
                    url: matchLink.href,
                    title: matchLink.text,
                    pageTitle: title,
                    hasBracket: bracketElements.title || bracketElements.section || bracketElements.card,
                    details: bracketElements
                });
                
            } catch (error) {
                console.error(`❌ 경기 ${i + 1} 확인 중 오류:`, error.message);
                results.push({
                    index: i + 1,
                    url: matchLink.href,
                    title: matchLink.text,
                    error: error.message,
                    hasBracket: false
                });
            }
        }
        
        // 4. 결과 종합
        console.log('\\n' + '='.repeat(60));
        console.log('📊 대진표 시스템 직접 테스트 결과');
        console.log('='.repeat(60));
        
        const totalMatches = results.length;
        const matchesWithBrackets = results.filter(r => r.hasBracket).length;
        const matchesWithErrors = results.filter(r => r.error).length;
        
        console.log(`\\n📈 기본 통계:`);
        console.log(`  • 테스트한 경기: ${totalMatches}개`);
        console.log(`  • 대진표 있는 경기: ${matchesWithBrackets}개`);
        console.log(`  • 오류 발생: ${matchesWithErrors}개`);
        console.log(`  • 성공률: ${totalMatches > 0 ? ((totalMatches - matchesWithErrors) / totalMatches * 100).toFixed(1) : 0}%`);
        
        if (matchesWithBrackets > 0) {
            console.log(`\\n🗂️ 대진표 상세 결과:`);
            results.filter(r => r.hasBracket).forEach(result => {
                console.log(`\\n  경기 ${result.index}: ${result.title}`);
                console.log(`    URL: ${result.url}`);
                console.log(`    페이지 제목: ${result.pageTitle}`);
                if (result.details) {
                    console.log(`    생성 버튼: ${result.details.createButton ? '있음' : '없음'}`);
                    console.log(`    팀 수: ${result.details.teams}개`);
                    console.log(`    게임 수: ${result.details.games}개`);
                }
            });
        }
        
        console.log('\\n✅ 직접 테스트 완료');
        
        // 최종 스크린샷
        await takeScreenshot(page, 'direct_test_complete', '직접 테스트 완료');
        
        // 기본 어서션
        expect(totalMatches).toBeGreaterThan(0);
        expect(matchesWithErrors).toBeLessThan(totalMatches);
    });
    
    test('특정 경기 타입별 대진표 확인', async ({ page }) => {
        console.log('🎯 경기 타입별 대진표 시스템 확인');
        
        // 알려진 경기 타입들의 URL 패턴으로 시도
        const matchTypes = [
            'single_elimination',
            'double_elimination', 
            'round_robin',
            'swiss',
            'league'
        ];
        
        await page.goto('http://localhost:3000/matches', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        
        // 페이지에서 각 타입의 경기 찾기
        const pageContent = await page.content();
        
        console.log('🔍 페이지 내용에서 경기 타입 검색...');
        
        for (const matchType of matchTypes) {
            const typeInKorean = {
                'single_elimination': '싱글 엘리미네이션',
                'double_elimination': '더블 엘리미네이션',
                'round_robin': '리그전',
                'swiss': '스위스',
                'league': '정규 리그'
            };
            
            console.log(`\\n--- ${typeInKorean[matchType]} (${matchType}) ---`);
            
            // 페이지 내용에서 해당 타입 검색
            const hasTypeText = pageContent.includes(matchType) || 
                               pageContent.includes(typeInKorean[matchType]);
            
            console.log(`페이지에서 발견: ${hasTypeText ? '✅' : '❌'}`);
            
            if (hasTypeText) {
                console.log(`${typeInKorean[matchType]} 관련 경기가 존재합니다.`);
            }
        }
        
        await takeScreenshot(page, 'match_types_search', '경기 타입 검색 결과');
        
        console.log('\\n✅ 경기 타입별 확인 완료');
    });
});

test.afterAll(async () => {
    console.log('🧹 직접 테스트 완료');
});