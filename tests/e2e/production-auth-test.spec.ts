import { test, expect } from '@playwright/test';

test.describe('Production Authentication Test', () => {
  test('should test authentication on production', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `prod${timestamp}@thematch.test`;
    const testPassword = 'Production123!';
    const testName = `프로덕션테스트${timestamp}`;
    
    console.log('=== Testing on Production (the-match-five.vercel.app) ===');
    
    // 1. 프로덕션 홈페이지 접속
    await page.goto('https://the-match-five.vercel.app');
    await page.waitForLoadState('networkidle');
    console.log('✅ Production site accessible');
    
    // 2. 회원가입 페이지 이동
    await page.goto('https://the-match-five.vercel.app/signup');
    await page.waitForLoadState('networkidle');
    
    // 3. 회원가입
    await page.fill('input[placeholder="홍길동"]', testName);
    await page.fill('input[placeholder="example@email.com"]', testEmail);
    await page.fill('input[placeholder="최소 8자 이상"]', testPassword);
    await page.fill('input[placeholder="비밀번호를 다시 입력하세요"]', testPassword);
    
    console.log('Creating production account...');
    await page.click('button:has-text("회원가입")');
    
    await page.waitForTimeout(5000);
    const afterSignupUrl = page.url();
    console.log('After signup URL:', afterSignupUrl);
    
    // 4. 로그인 페이지로 이동
    await page.goto('https://the-match-five.vercel.app/login');
    await page.waitForLoadState('networkidle');
    
    // 5. 로그인
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    console.log('Logging in on production...');
    await page.click('button:has-text("로그인")');
    
    await page.waitForTimeout(5000);
    const afterLoginUrl = page.url();
    console.log('After login URL:', afterLoginUrl);
    
    // 6. 인증 확인
    if (afterLoginUrl.includes('dashboard') || afterLoginUrl.includes('matches')) {
      console.log('✅ Production login successful');
      
      // 7. 보호된 라우트 테스트
      await page.goto('https://the-match-five.vercel.app/profile');
      await page.waitForTimeout(3000);
      const profileUrl = page.url();
      
      if (!profileUrl.includes('login')) {
        console.log('✅ Production profile page accessible');
      } else {
        console.log('⚠️ Production profile page redirected to login');
      }
      
      await page.goto('https://the-match-five.vercel.app/matches/create');
      await page.waitForTimeout(3000);
      const matchCreateUrl = page.url();
      
      if (!matchCreateUrl.includes('login')) {
        console.log('✅ Production match create page accessible');
      } else {
        console.log('⚠️ Production match create page redirected to login');
      }
      
      console.log('=== Production authentication test completed ===');
    } else {
      console.log('❌ Production login failed');
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'tests/e2e/screenshots/production-test-final.png' });
  });
});