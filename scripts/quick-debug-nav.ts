import { chromium } from 'playwright';

const BASE_URL = 'https://the-match-five.vercel.app';

async function debugNavigation() {
    console.log('🔍 네비게이션 구조 디버깅');
    
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000 
    });
    
    const context = await browser.newContext({ 
        viewport: { width: 1280, height: 720 } 
    });
    
    const page = await context.newPage();
    
    try {
        // 로그인
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[placeholder*="example"]', 'thematch.test1@gmail.com');
        await page.fill('input[placeholder*="비밀번호"]', 'Test123!@#');
        await page.click('button[type="submit"]');
        
        // 경기 페이지 로딩 대기
        await page.waitForURL('**/matches', { timeout: 10000 });
        console.log('✅ 로그인 완료 - 경기 페이지');
        
        // 페이지 스크린샷
        await page.screenshot({ path: 'debug-after-login.png', fullPage: true });
        
        // 모든 링크 찾기
        const allLinks = await page.locator('a').all();
        console.log(`\n📋 페이지의 모든 링크 (${allLinks.length}개):`);
        
        for (let i = 0; i < allLinks.length; i++) {
            try {
                const href = await allLinks[i].getAttribute('href');
                const text = await allLinks[i].textContent();
                const visible = await allLinks[i].isVisible();
                console.log(`  ${i+1}. href="${href}" text="${text?.trim()}" visible=${visible}`);
            } catch (e) {
                console.log(`  ${i+1}. 링크 정보 가져오기 실패`);
            }
        }
        
        // 네비게이션 관련 요소들 찾기
        console.log('\n🔍 네비게이션 관련 요소:');
        
        const navElements = [
            'nav',
            '[role="navigation"]',
            '.navbar',
            '.nav',
            '.header',
            'header'
        ];
        
        for (const selector of navElements) {
            try {
                const elements = await page.locator(selector).all();
                if (elements.length > 0) {
                    console.log(`  ${selector}: ${elements.length}개 발견`);
                }
            } catch (e) {
                // 무시
            }
        }
        
        // '팀' 텍스트를 포함하는 모든 요소 찾기
        console.log('\n🔍 "팀" 텍스트를 포함하는 요소들:');
        const teamElements = await page.locator('text=팀').all();
        
        for (let i = 0; i < teamElements.length; i++) {
            try {
                const element = teamElements[i];
                const tagName = await element.evaluate(el => el.tagName);
                const text = await element.textContent();
                const visible = await element.isVisible();
                const href = await element.getAttribute('href');
                
                console.log(`  ${i+1}. <${tagName.toLowerCase()}> text="${text?.trim()}" visible=${visible} href="${href}"`);
            } catch (e) {
                console.log(`  ${i+1}. 요소 정보 가져오기 실패`);
            }
        }
        
        // 모바일 메뉴 버튼 확인
        console.log('\n🔍 모바일 메뉴 확인:');
        const mobileMenuButton = page.locator('button').filter({ hasText: /menu|Menu|메뉴/ }).or(
            page.locator('[aria-label*="menu"], [aria-label*="Menu"]')
        ).or(
            page.locator('svg').filter({ hasText: /bars|hamburger/ })
        );
        
        const mobileMenuVisible = await mobileMenuButton.first().isVisible();
        console.log(`  모바일 메뉴 버튼 보임: ${mobileMenuVisible}`);
        
        if (mobileMenuVisible) {
            console.log('  모바일 메뉴 클릭 시도...');
            await mobileMenuButton.first().click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'debug-mobile-menu-open.png' });
            
            // 모바일 메뉴에서 팀 링크 찾기
            const mobileTeamLinks = await page.locator('text=팀').all();
            console.log(`  모바일 메뉴에서 팀 링크: ${mobileTeamLinks.length}개`);
        }
        
        // 1분 대기 후 브라우저 유지
        console.log('\n⏳ 1분간 브라우저를 열어둡니다. 수동 확인 후 Ctrl+C로 종료하세요.');
        await new Promise(resolve => setTimeout(resolve, 60000));
        
    } catch (error) {
        console.error('❌ 오류:', error.message);
        await page.screenshot({ path: 'debug-navigation-error.png' });
    } finally {
        await browser.close();
    }
}

debugNavigation();