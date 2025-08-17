import { test, expect } from '@playwright/test';

test.describe('Create Account and Test Auth', () => {
  test('should create account and test authentication', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@thematch.test`;
    const testPassword = 'TestPassword123!';
    const testName = `테스트유저${timestamp}`;
    
    // 콘솔 로그 캡처
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('Auth')) {
        console.log(`[Browser] ${msg.type()}: ${msg.text()}`);
      }
    });
    
    // 1. 회원가입 페이지로 이동
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    
    // 2. 회원가입 폼 작성
    await page.fill('input[placeholder="홍길동"]', testName);
    await page.fill('input[placeholder="example@email.com"]', testEmail);
    await page.fill('input[placeholder="최소 8자 이상"]', testPassword);
    await page.fill('input[placeholder="비밀번호를 다시 입력하세요"]', testPassword);
    
    // 3. 회원가입 버튼 클릭
    console.log('Creating account...');
    await page.click('button:has-text("회원가입")');
    
    // 4. 회원가입 후 결과 확인 (대시보드 또는 성공 메시지)
    await page.waitForTimeout(3000);
    const urlAfterSignup = page.url();
    console.log('URL after signup:', urlAfterSignup);
    
    // 스크린샷
    await page.screenshot({ path: 'tests/e2e/screenshots/test-after-signup.png' });
    
    // 5. 로그아웃 (만약 자동 로그인되었다면)
    if (urlAfterSignup.includes('dashboard')) {
      console.log('Auto-logged in, logging out...');
      await page.goto('http://localhost:3000');
      // 로그아웃 버튼 찾기 시도
      const logoutButton = await page.$('button:has-text("로그아웃")');
      if (logoutButton) {
        await logoutButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // 6. 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // 7. 로그인 시도
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    console.log('Attempting login with:', testEmail);
    await page.click('button:has-text("로그인")');
    
    // 8. 로그인 결과 확인
    await page.waitForTimeout(5000);
    const urlAfterLogin = page.url();
    console.log('URL after login:', urlAfterLogin);
    
    // 스크린샷
    await page.screenshot({ path: 'tests/e2e/screenshots/test-after-login.png' });
    
    // 9. 세션 확인
    const cookies = await page.context().cookies();
    console.log('Cookies found:', cookies.filter(c => c.name.includes('supabase')).map(c => c.name));
    
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.includes('auth')) {
          items[key] = 'exists';
        }
      }
      return items;
    });
    console.log('Auth in localStorage:', Object.keys(localStorage));
    
    // 10. 보호된 라우트 접근 테스트
    if (urlAfterLogin.includes('dashboard') || urlAfterLogin.includes('matches')) {
      console.log('Login successful! Testing protected routes...');
      
      await page.goto('http://localhost:3000/profile');
      await page.waitForTimeout(2000);
      const profileUrl = page.url();
      console.log('Profile page URL:', profileUrl);
      
      if (!profileUrl.includes('login')) {
        console.log('✅ Authentication working! Can access profile page.');
      } else {
        console.log('❌ Still redirected to login from profile page.');
      }
    } else {
      console.log('❌ Login failed. Still on login page.');
    }
    
    // 대기
    await page.waitForTimeout(10000);
  });
});