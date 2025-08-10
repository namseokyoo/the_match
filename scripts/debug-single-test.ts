import { chromium } from 'playwright';

const BASE_URL = 'https://the-match-five.vercel.app';

async function debugSingleFlow() {
    console.log('🔍 단일 사용자 플로우 디버깅 시작');
    
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 2000  // 느리게 실행해서 관찰
    });
    
    const context = await browser.newContext({ 
        viewport: { width: 1280, height: 720 } 
    });
    
    const page = await context.newPage();
    
    try {
        // Step 1: Login
        console.log('1️⃣ 로그인 테스트');
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[placeholder*="example"]', 'thematch.test1@gmail.com');
        await page.fill('input[placeholder*="비밀번호"]', 'Test123!@#');
        await page.click('button[type="submit"]');
        
        await page.waitForTimeout(3000);
        console.log(`✅ 로그인 완료 - 현재 URL: ${page.url()}`);
        
        // Step 2: Navigate to teams
        console.log('2️⃣ 팀 페이지로 이동');
        const teamsLink = page.locator('a[href="/teams"], text=팀').first();
        if (await teamsLink.isVisible()) {
            await teamsLink.click();
            await page.waitForLoadState('networkidle');
            console.log(`✅ 팀 페이지 이동 완료 - 현재 URL: ${page.url()}`);
        } else {
            console.log('❌ 팀 링크를 찾을 수 없음');
            // 스크린샷으로 현재 상태 확인
            await page.screenshot({ path: 'debug-no-teams-link.png' });
        }
        
        // Step 3: Check team creation button
        console.log('3️⃣ 팀 생성 버튼 확인');
        await page.screenshot({ path: 'debug-teams-page.png' });
        
        const createButton = page.locator('button:has-text("팀 생성")').first();
        const createButtonVisible = await createButton.isVisible();
        console.log(`팀 생성 버튼 표시됨: ${createButtonVisible}`);
        
        if (createButtonVisible) {
            await createButton.click();
            await page.waitForLoadState('networkidle');
            console.log(`✅ 팀 생성 페이지 이동 - 현재 URL: ${page.url()}`);
            await page.screenshot({ path: 'debug-team-create-form.png' });
            
            // Check form fields
            const nameField = page.locator('input[id="name"]');
            const nameFieldVisible = await nameField.isVisible();
            console.log(`이름 필드 표시됨: ${nameFieldVisible}`);
            
            const descField = page.locator('textarea[id="description"]');
            const descFieldVisible = await descField.isVisible();
            console.log(`설명 필드 표시됨: ${descFieldVisible}`);
        }
        
        // Step 4: Test match navigation
        console.log('4️⃣ 경기 페이지로 이동');
        await page.goto(`${BASE_URL}/matches`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'debug-matches-page.png' });
        
        const matchCreateButton = page.locator('button:has-text("경기 생성")').first();
        const matchCreateButtonVisible = await matchCreateButton.isVisible();
        console.log(`경기 생성 버튼 표시됨: ${matchCreateButtonVisible}`);
        
        console.log('✅ 디버깅 완료');
        
    } catch (error) {
        console.error('❌ 디버깅 중 오류:', error);
        await page.screenshot({ path: 'debug-error.png' });
    } finally {
        console.log('🔍 스크린샷들을 확인해주세요:');
        console.log('- debug-teams-page.png');
        console.log('- debug-team-create-form.png');
        console.log('- debug-matches-page.png');
        
        // 브라우저 닫지 않고 대기 (수동으로 확인 가능)
        console.log('브라우저를 열어둡니다. 수동으로 확인 후 터미널에서 Ctrl+C로 종료하세요.');
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1분 대기
        await browser.close();
    }
}

debugSingleFlow();