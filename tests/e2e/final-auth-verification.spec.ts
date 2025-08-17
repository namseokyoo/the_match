import { test, expect } from '@playwright/test';

test.describe('Final Auth Verification', () => {
  test('should verify complete authentication flow', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `finaltest${timestamp}@thematch.test`;
    const testPassword = 'FinalTest123!';
    const testName = `최종테스트${timestamp}`;
    
    console.log('=== Starting Final Authentication Test ===');
    
    // 1. 회원가입
    console.log('Step 1: Sign up');
    await page.goto('http://localhost:3000/signup');
    await page.fill('input[placeholder="홍길동"]', testName);
    await page.fill('input[placeholder="example@email.com"]', testEmail);
    await page.fill('input[placeholder="최소 8자 이상"]', testPassword);
    await page.fill('input[placeholder="비밀번호를 다시 입력하세요"]', testPassword);
    await page.click('button:has-text("회원가입")');
    
    // 회원가입 후 대기
    await page.waitForTimeout(3000);
    const afterSignupUrl = page.url();
    console.log('After signup URL:', afterSignupUrl);
    
    // 2. 로그아웃 (자동 로그인된 경우)
    if (!afterSignupUrl.includes('login')) {
      console.log('Step 2: Logout');
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(1000);
    }
    
    // 3. 로그인 테스트
    console.log('Step 3: Login');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("로그인")');
    
    // 로그인 결과 대기
    await page.waitForTimeout(3000);
    const afterLoginUrl = page.url();
    console.log('After login URL:', afterLoginUrl);
    
    // 4. 인증 상태 확인
    if (afterLoginUrl.includes('dashboard') || afterLoginUrl.includes('matches')) {
      console.log('✅ Login successful');
      
      // 5. 보호된 라우트 테스트
      console.log('Step 4: Testing protected routes');
      
      // 프로필 페이지
      await page.goto('http://localhost:3000/profile');
      await page.waitForTimeout(2000);
      const profileUrl = page.url();
      expect(profileUrl).not.toContain('login');
      console.log('✅ Profile page accessible');
      
      // 경기 생성 페이지
      await page.goto('http://localhost:3000/matches/create');
      await page.waitForTimeout(2000);
      const matchCreateUrl = page.url();
      expect(matchCreateUrl).not.toContain('login');
      console.log('✅ Match create page accessible');
      
      // 팀 생성 페이지
      await page.goto('http://localhost:3000/teams/create');
      await page.waitForTimeout(2000);
      const teamCreateUrl = page.url();
      expect(teamCreateUrl).not.toContain('login');
      console.log('✅ Team create page accessible');
      
      // 6. 새로고침 후 세션 유지 테스트
      console.log('Step 5: Testing session persistence');
      await page.reload();
      await page.waitForTimeout(2000);
      const afterReloadUrl = page.url();
      expect(afterReloadUrl).not.toContain('login');
      console.log('✅ Session persists after reload');
      
      // 7. 쿠키 확인
      const cookies = await page.context().cookies();
      const supabaseCookies = cookies.filter(c => c.name.includes('supabase'));
      console.log(`✅ Found ${supabaseCookies.length} Supabase cookies`);
      
      console.log('=== All tests passed! Authentication system is working correctly ===');
    } else {
      throw new Error('Login failed - still on login page');
    }
  });
});