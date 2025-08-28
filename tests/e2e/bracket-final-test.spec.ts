import { test, expect, Page } from '@playwright/test';

// 확인된 경기 ID들
const TEST_MATCHES = [
    {
        id: '001a7b74-c33f-46f3-98d1-dbf4e9a05aea',
        title: '대진표 테스트 토너먼트',
        type: 'single_elimination',
        status: 'in_progress'
    },
    {
        id: '297e005b-f26f-4ccf-93f8-23075d506193',
        title: '테스트 단일 엘리미네이션 (8팀)',
        type: 'single_elimination',
        status: 'registration'
    },
    {
        id: '28c3b60a-3612-43b2-8e0c-1a1fb7de5516',
        title: '테스트 더블 엘리미네이션 (8팀)',
        type: 'double_elimination',
        status: 'registration'
    },
    {
        id: '8773b36c-3f9c-40ce-b2ac-09896531ac2d',
        title: '테스트 리그전 (6팀)',
        type: 'round_robin',
        status: 'registration'
    },
    {
        id: '5576ef43-6074-4eb4-82ea-14604cb7f759',
        title: '테스트 스위스 (16팀)',
        type: 'swiss',
        status: 'registration'
    },
    {
        id: 'ae17b5bf-e470-4007-92dd-6705890f6d95',
        title: '테스트 정규 리그 (10팀)',
        type: 'league',
        status: 'registration'
    }
];

// 유틸리티 함수들
async function takeScreenshot(page: Page, filename: string, description: string = '') {
    const path = `test-results/final_${filename}_${Date.now()}.png`;
    await page.screenshot({ 
        path,
        fullPage: true 
    });
    console.log(`📸 스크린샷 저장: ${path} ${description ? `- ${description}` : ''}`);
    return path;
}

test.describe('The Match 대진표 시스템 최종 검증', () => {
    
    test.setTimeout(120000); // 2분 타임아웃
    
    test('모든 경기 타입별 대진표 시스템 최종 검증', async ({ page }) => {
        console.log('🎯 The Match 대진표 시스템 최종 검증 테스트');
        console.log('==================================================');
        
        const results = [];
        
        for (let i = 0; i < TEST_MATCHES.length; i++) {
            const match = TEST_MATCHES[i];
            console.log(`\\n--- 검증 ${i + 1}/${TEST_MATCHES.length}: ${match.title} ---`);
            console.log(`타입: ${match.type} | 상태: ${match.status}`);
            
            try {
                // 1. 경기 상세 페이지 직접 접근
                const url = `http://localhost:3000/matches/${match.id}`;
                console.log(`🌐 URL 접근: ${url}`);
                
                await page.goto(url, { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(5000); // 충분한 로딩 시간
                
                const currentUrl = page.url();
                const pageTitle = await page.title();
                
                console.log(`✅ 페이지 로드 성공`);
                console.log(`📄 페이지 제목: ${pageTitle}`);
                console.log(`🌐 현재 URL: ${currentUrl}`);
                
                await takeScreenshot(page, `${match.type}_page`, `${match.title} 상세 페이지`);
                
                // 2. 대진표 섹션 확인
                console.log(`🗂️ 대진표 섹션 검색...`);
                
                const bracketChecks = {
                    titleExists: false,
                    sectionExists: false,
                    cardExists: false,
                    createButtonExists: false,
                    teamsInfo: '',
                    gamesCount: 0,
                    rounds: 0,
                    selector: ''
                };
                
                // 다양한 대진표 선택자 시도
                const bracketSelectors = [
                    { selector: 'text=대진표', name: '대진표 텍스트' },
                    { selector: 'h2:text("대진표")', name: '대진표 h2' },
                    { selector: 'h3:text("대진표")', name: '대진표 h3' },
                    { selector: 'div:has(h2:text("대진표"))', name: '대진표 카드' },
                    { selector: '[data-testid="bracket-section"]', name: '대진표 데이터 속성' },
                    { selector: '.bracket-section', name: '대진표 클래스' }
                ];
                
                for (const { selector, name } of bracketSelectors) {
                    try {
                        const element = page.locator(selector);
                        const isVisible = await element.isVisible();
                        
                        if (isVisible) {
                            console.log(`  ✅ ${name} 발견 (${selector})`);
                            
                            if (selector.includes('text=대진표')) bracketChecks.titleExists = true;
                            if (selector.includes('h2:text')) bracketChecks.sectionExists = true;
                            if (selector.includes('div:has')) bracketChecks.cardExists = true;
                            
                            bracketChecks.selector = selector;
                            break;
                        }
                    } catch (error) {
                        // 선택자 실패, 다음으로 넘어감
                    }
                }
                
                const hasBracket = bracketChecks.titleExists || bracketChecks.sectionExists || bracketChecks.cardExists;
                
                if (hasBracket) {
                    console.log(`🎊 대진표 시스템 발견! 상세 분석...`);
                    
                    // 3. 대진표 생성 버튼 확인
                    const createButtonSelectors = [
                        'text=대진표 생성하기',
                        'text=대진표 생성',
                        'button:has-text("생성")',
                        'button:has-text("대진표")',
                        'text=생성하기'
                    ];
                    
                    for (const buttonSelector of createButtonSelectors) {
                        try {
                            const button = page.locator(buttonSelector);
                            if (await button.isVisible()) {
                                bracketChecks.createButtonExists = true;
                                console.log(`  🔘 생성 버튼 발견: ${buttonSelector}`);
                                break;
                            }
                        } catch (error) {
                            // 버튼 없음
                        }
                    }
                    
                    // 4. 팀 정보 확인
                    const teamSelectors = [
                        'text=/승인된 팀:?\\s*\\d+개?/',
                        'text=/팀:?\\s*\\d+개?/',
                        'text=/참가:?\\s*\\d+/',
                        'text=/참가팀:?\\s*\\d+/'
                    ];
                    
                    for (const teamSelector of teamSelectors) {
                        try {
                            const element = page.locator(teamSelector);
                            if (await element.isVisible()) {
                                const text = await element.textContent();
                                if (text) {
                                    bracketChecks.teamsInfo = text.trim();
                                    console.log(`  👥 팀 정보: ${bracketChecks.teamsInfo}`);
                                    break;
                                }
                            }
                        } catch (error) {
                            // 팀 정보 없음
                        }
                    }
                    
                    // 5. 게임 카드 수 확인
                    const gameSelectors = [
                        'div:has-text("vs")',
                        '.game-card',
                        '[data-testid="game-card"]',
                        'div[class*="game"]'
                    ];
                    
                    for (const gameSelector of gameSelectors) {
                        try {
                            const count = await page.locator(gameSelector).count();
                            if (count > bracketChecks.gamesCount) {
                                bracketChecks.gamesCount = count;
                            }
                        } catch (error) {
                            // 게임 카드 없음
                        }
                    }
                    console.log(`  ⚔️ 게임 수: ${bracketChecks.gamesCount}개`);
                    
                    // 6. 라운드/섹션 수 확인
                    try {
                        const roundElements = await page.locator('h3, .round-title, [class*="round"]').count();
                        bracketChecks.rounds = roundElements;
                        console.log(`  📅 라운드/섹션 수: ${bracketChecks.rounds}개`);
                    } catch (error) {
                        console.log(`  📅 라운드 정보: 확인 불가`);
                    }
                    
                    // 대진표 상세 스크린샷
                    await takeScreenshot(page, `${match.type}_bracket`, `${match.title} 대진표 상세`);
                    
                } else {
                    console.log(`❌ 대진표 시스템을 찾을 수 없습니다.`);
                    
                    // 페이지 내용 디버깅
                    const pageContent = await page.content();
                    const hasBracketText = pageContent.includes('대진표');
                    console.log(`  🔍 페이지에 '대진표' 텍스트 존재: ${hasBracketText}`);
                }
                
                // 결과 저장
                results.push({
                    match: match,
                    success: true,
                    hasBracket: hasBracket,
                    details: bracketChecks,
                    pageTitle: pageTitle,
                    url: currentUrl
                });
                
                console.log(`✅ ${match.title} 검증 완료`);
                
            } catch (error) {
                console.error(`❌ ${match.title} 검증 중 오류:`, error.message);
                
                results.push({
                    match: match,
                    success: false,
                    error: error.message,
                    hasBracket: false
                });
            }
            
            // 다음 테스트를 위한 잠시 대기
            await page.waitForTimeout(1000);
        }
        
        // 7. 최종 결과 종합
        console.log('\\n' + '='.repeat(70));
        console.log('📊 The Match 대진표 시스템 최종 검증 결과');
        console.log('='.repeat(70));
        
        const totalMatches = results.length;
        const successfulTests = results.filter(r => r.success).length;
        const matchesWithBrackets = results.filter(r => r.hasBracket).length;
        const failedTests = results.filter(r => !r.success).length;
        
        console.log(`\\n📈 전체 통계:`);
        console.log(`  • 총 테스트 경기: ${totalMatches}개`);
        console.log(`  • 성공적으로 접근: ${successfulTests}개`);
        console.log(`  • 대진표 시스템 확인: ${matchesWithBrackets}개`);
        console.log(`  • 실패한 테스트: ${failedTests}개`);
        console.log(`  • 전체 성공률: ${totalMatches > 0 ? (successfulTests / totalMatches * 100).toFixed(1) : 0}%`);
        console.log(`  • 대진표 시스템 커버리지: ${totalMatches > 0 ? (matchesWithBrackets / totalMatches * 100).toFixed(1) : 0}%`);
        
        // 경기 타입별 결과
        console.log(`\\n🗂️ 경기 타입별 대진표 시스템 결과:`);
        
        const typeResults = {
            'single_elimination': { total: 0, withBracket: 0 },
            'double_elimination': { total: 0, withBracket: 0 },
            'round_robin': { total: 0, withBracket: 0 },
            'swiss': { total: 0, withBracket: 0 },
            'league': { total: 0, withBracket: 0 }
        };
        
        results.forEach(result => {
            if (result.success) {
                const type = result.match.type;
                typeResults[type].total++;
                if (result.hasBracket) {
                    typeResults[type].withBracket++;
                }
            }
        });
        
        Object.entries(typeResults).forEach(([type, stats]) => {
            const typeName = {
                'single_elimination': '싱글 엘리미네이션',
                'double_elimination': '더블 엘리미네이션',
                'round_robin': '리그전',
                'swiss': '스위스',
                'league': '정규 리그'
            }[type];
            
            console.log(`  • ${typeName}: ${stats.withBracket}/${stats.total} (${stats.total > 0 ? (stats.withBracket / stats.total * 100).toFixed(1) : 0}%)`);
        });
        
        // 상세 결과
        if (matchesWithBrackets > 0) {
            console.log(`\\n🎊 대진표 시스템이 확인된 경기들:`);
            
            results.filter(r => r.hasBracket).forEach((result, index) => {
                console.log(`\\n  ${index + 1}. ${result.match.title}`);
                console.log(`     타입: ${result.match.type}`);
                console.log(`     URL: ${result.url}`);
                console.log(`     생성 버튼: ${result.details?.createButtonExists ? '✅' : '❌'}`);
                console.log(`     팀 정보: ${result.details?.teamsInfo || '정보 없음'}`);
                console.log(`     게임 수: ${result.details?.gamesCount || 0}개`);
                console.log(`     라운드 수: ${result.details?.rounds || 0}개`);
            });
        }
        
        // 실패한 테스트
        if (failedTests > 0) {
            console.log(`\\n❌ 실패한 테스트들:`);
            results.filter(r => !r.success).forEach((result, index) => {
                console.log(`  ${index + 1}. ${result.match.title}: ${result.error}`);
            });
        }
        
        console.log('\\n✅ The Match 대진표 시스템 최종 검증 완료!');
        
        // 최종 어서션
        expect(totalMatches).toBeGreaterThan(0);
        expect(successfulTests).toBeGreaterThan(0);
        expect(failedTests).toBeLessThan(totalMatches);
        
        // 대진표 시스템이 최소 하나는 작동해야 함
        expect(matchesWithBrackets).toBeGreaterThan(0);
        
        console.log(`\\n🎉 모든 검증이 완료되었습니다!`);
    });
});

test.afterAll(async () => {
    console.log('🧹 최종 검증 테스트 완료');
});