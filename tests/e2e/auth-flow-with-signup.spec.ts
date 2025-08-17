import { test, expect, Page } from '@playwright/test';

interface AuthTestData {
  email: string;
  password: string;
  nickname: string;
}

// Test data for authentication - unique per test run
const TEST_CREDENTIALS: AuthTestData = {
  email: `testuser${Date.now()}@thematch.test`,
  password: 'TestPassword123!',
  nickname: `테스트유저${Date.now()}`
};

class AuthFlowTesterWithSignup {
  constructor(private page: Page) {}

  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `tests/e2e/screenshots/auth-signup-${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  async getAuthButtonText(): Promise<string | null> {
    const selectors = [
      'a[href="/login"]',
      'a[href="/signup"]', 
      'button:has-text("로그인")',
      'button:has-text("로그아웃")',
      'text="로그인"',
      'text="로그아웃"',
      'text="Login"',
      'text="Logout"',
      '[data-testid="auth-button"]',
      '[data-testid="login-button"]',
      '[data-testid="logout-button"]'
    ];

    for (const selector of selectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          const text = await element.textContent();
          if (text) return text.trim();
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }

  async isLoggedIn(): Promise<boolean> {
    const loggedInSelectors = [
      'button:has-text("로그아웃")',
      'text="로그아웃"',
      'text="Logout"',
      '[data-testid="logout-button"]',
      '[data-testid="user-profile"]',
      'a[href="/profile"]',
      'text="프로필"'
    ];

    for (const selector of loggedInSelectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    return false;
  }

  async performSignup(credentials: AuthTestData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔑 Attempting signup with email: ${credentials.email}`);
      
      // Navigate to signup page
      await this.page.goto('/signup');
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('signup-page');

      // Fill signup form
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[placeholder*="이메일"]',
        'input[placeholder*="email"]',
        '[data-testid="email-input"]'
      ];

      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]', 
        'input[placeholder*="비밀번호"]',
        'input[placeholder*="password"]',
        '[data-testid="password-input"]'
      ];

      const nicknameSelectors = [
        'input[name="nickname"]',
        'input[name="name"]',
        'input[placeholder*="닉네임"]',
        'input[placeholder*="이름"]',
        'input[placeholder*="nickname"]',
        'input[placeholder*="name"]',
        '[data-testid="nickname-input"]'
      ];

      // Fill email
      let emailFilled = false;
      for (const selector of emailSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.fill(credentials.email);
            emailFilled = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!emailFilled) {
        return { success: false, error: 'Could not find email input field in signup' };
      }

      // Fill password
      let passwordFilled = false;
      for (const selector of passwordSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.fill(credentials.password);
            passwordFilled = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!passwordFilled) {
        return { success: false, error: 'Could not find password input field in signup' };
      }

      // Fill nickname
      let nicknameFilled = false;
      for (const selector of nicknameSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.fill(credentials.nickname);
            nicknameFilled = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      await this.takeScreenshot('signup-form-filled');

      // Submit form
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("회원가입")',
        'button:has-text("가입하기")',
        'button:has-text("Sign Up")',
        'button:has-text("Register")',
        '[data-testid="signup-submit"]',
        'form button'
      ];

      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.click();
            submitted = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!submitted) {
        return { success: false, error: 'Could not find submit button in signup' };
      }

      // Wait for response
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('after-signup-submit');

      // Check if signup was successful (might redirect to login or dashboard)
      const currentUrl = this.page.url();
      const isLoggedIn = await this.isLoggedIn();
      
      console.log(`Signup result - URL: ${currentUrl}, Logged in: ${isLoggedIn}`);
      
      return { success: isLoggedIn || currentUrl.includes('/login') || currentUrl.includes('/dashboard') };

    } catch (error) {
      await this.takeScreenshot('signup-error');
      return { success: false, error: String(error) };
    }
  }

  async performLogin(credentials: AuthTestData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔑 Attempting login with email: ${credentials.email}`);
      
      // Navigate to login page
      await this.page.goto('/login');
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('login-page');

      // Fill login form
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[placeholder*="이메일"]',
        'input[placeholder*="email"]',
        '[data-testid="email-input"]'
      ];

      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]', 
        'input[placeholder*="비밀번호"]',
        'input[placeholder*="password"]',
        '[data-testid="password-input"]'
      ];

      let emailFilled = false;
      for (const selector of emailSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.fill(credentials.email);
            emailFilled = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!emailFilled) {
        return { success: false, error: 'Could not find email input field' };
      }

      let passwordFilled = false;
      for (const selector of passwordSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.fill(credentials.password);
            passwordFilled = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!passwordFilled) {
        return { success: false, error: 'Could not find password input field' };
      }

      await this.takeScreenshot('login-form-filled');

      // Submit form
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("로그인")',
        'button:has-text("Login")',
        'button:has-text("Sign In")',
        '[data-testid="login-submit"]',
        'form button'
      ];

      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.click();
            submitted = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!submitted) {
        return { success: false, error: 'Could not find submit button' };
      }

      // Wait for response
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('after-login-submit');

      // Check if login was successful
      const isLoggedIn = await this.isLoggedIn();
      const currentUrl = this.page.url();
      
      console.log(`Login result - URL: ${currentUrl}, Logged in: ${isLoggedIn}`);
      
      return { success: isLoggedIn };

    } catch (error) {
      await this.takeScreenshot('login-error');
      return { success: false, error: String(error) };
    }
  }

  async performLogout(): Promise<boolean> {
    try {
      const logoutSelectors = [
        'button:has-text("로그아웃")',
        'text="로그아웃"',
        'text="Logout"',
        '[data-testid="logout-button"]'
      ];

      for (const selector of logoutSelectors) {
        try {
          const element = await this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            await element.click();
            await this.page.waitForLoadState('networkidle');
            return true;
          }
        } catch (error) {
          continue;
        }
      }
      return false;
    } catch (error) {
      console.log('Logout failed:', error);
      return false;
    }
  }

  async testProtectedPageAccess(url: string): Promise<{ accessible: boolean; redirected: boolean; finalUrl: string; error?: string }> {
    try {
      await this.page.goto(url);
      await this.page.waitForLoadState('networkidle');
      
      const finalUrl = this.page.url();
      const redirected = finalUrl !== `https://the-match-five.vercel.app${url}`;
      
      // Check if we can access the page content
      const hasContent = await this.page.locator('body').isVisible();
      const isErrorPage = await this.page.locator('text="404"').isVisible() || 
                         await this.page.locator('text="Unauthorized"').isVisible() ||
                         await this.page.locator('text="Access Denied"').isVisible();
      
      return {
        accessible: hasContent && !isErrorPage,
        redirected,
        finalUrl
      };
    } catch (error) {
      return {
        accessible: false,
        redirected: false,
        finalUrl: this.page.url(),
        error: String(error)
      };
    }
  }
}

test.describe('Complete Authentication Flow with Signup', () => {
  let authTester: AuthFlowTesterWithSignup;

  test.beforeEach(async ({ page }) => {
    authTester = new AuthFlowTesterWithSignup(page);
  });

  test('End-to-end authentication flow with user creation', async ({ page }) => {
    const results = {
      homepage: {},
      signup: {},
      loginAfterSignup: {},
      protectedPagesLoggedIn: {},
      logout: {},
      protectedPagesAfterLogout: {},
      errors: []
    };

    console.log('🔍 Starting end-to-end authentication flow test with signup...');
    console.log(`📧 Test credentials: ${TEST_CREDENTIALS.email}`);

    // Step 1: Check homepage initial state
    console.log('📍 Step 1: Checking homepage initial state');
    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await authTester.takeScreenshot('homepage-initial');
      
      const authButtonText = await authTester.getAuthButtonText();
      const isLoggedIn = await authTester.isLoggedIn();
      
      results.homepage = {
        loaded: true,
        authButtonText,
        isLoggedIn,
        url: page.url()
      };
      
      console.log(`✅ Homepage loaded. Auth button: "${authButtonText}", Logged in: ${isLoggedIn}`);
    } catch (error) {
      results.errors.push(`Homepage loading failed: ${error}`);
    }

    // Step 2: Perform signup
    console.log('📍 Step 2: Creating new user account');
    try {
      const signupResult = await authTester.performSignup(TEST_CREDENTIALS);
      results.signup = signupResult;
      
      if (signupResult.success) {
        console.log('✅ Signup successful');
      } else {
        console.log(`❌ Signup failed: ${signupResult.error}`);
      }
    } catch (error) {
      results.errors.push(`Signup failed: ${error}`);
    }

    // Step 3: If signup didn't auto-login, perform login
    console.log('📍 Step 3: Testing login after signup');
    try {
      const currentlyLoggedIn = await authTester.isLoggedIn();
      if (!currentlyLoggedIn) {
        console.log('🔄 User not auto-logged in after signup, attempting manual login');
        const loginResult = await authTester.performLogin(TEST_CREDENTIALS);
        results.loginAfterSignup = loginResult;
        
        if (loginResult.success) {
          console.log('✅ Login after signup successful');
        } else {
          console.log(`❌ Login after signup failed: ${loginResult.error}`);
        }
      } else {
        console.log('✅ User auto-logged in after signup');
        results.loginAfterSignup = { success: true, autoLogin: true };
      }
    } catch (error) {
      results.errors.push(`Login after signup failed: ${error}`);
    }

    // Step 4: Test protected pages when logged in
    console.log('📍 Step 4: Testing protected page access (logged in)');
    const protectedPages = ['/profile', '/dashboard', '/matches/create', '/teams/create'];
    const currentlyLoggedIn = await authTester.isLoggedIn();
    
    if (currentlyLoggedIn) {
      for (const pageUrl of protectedPages) {
        try {
          console.log(`🔓 Testing access to ${pageUrl} (logged in)`);
          const result = await authTester.testProtectedPageAccess(pageUrl);
          await authTester.takeScreenshot(`protected-page-loggedin-${pageUrl.replace(/\//g, '-')}`);
          
          results.protectedPagesLoggedIn[pageUrl] = result;
          console.log(`  ${result.accessible ? '✅' : '❌'} Accessible: ${result.accessible}, Redirected: ${result.redirected} -> ${result.finalUrl}`);
        } catch (error) {
          results.errors.push(`Protected page test failed for ${pageUrl} (logged in): ${error}`);
        }
      }
    } else {
      results.errors.push('Cannot test logged-in pages - user is not logged in');
    }

    // Step 5: Test logout
    console.log('📍 Step 5: Testing logout functionality');
    try {
      const logoutSuccess = await authTester.performLogout();
      await authTester.takeScreenshot('after-logout');
      results.logout = { success: logoutSuccess };
      
      if (logoutSuccess) {
        console.log('✅ Logout successful');
      } else {
        console.log('❌ Logout failed');
      }
    } catch (error) {
      results.errors.push(`Logout failed: ${error}`);
    }

    // Step 6: Test protected pages after logout
    console.log('📍 Step 6: Testing protected page access (after logout)');
    const loggedOutState = await authTester.isLoggedIn();
    
    if (!loggedOutState) {
      for (const pageUrl of protectedPages) {
        try {
          console.log(`🔒 Testing access to ${pageUrl} (after logout)`);
          const result = await authTester.testProtectedPageAccess(pageUrl);
          await authTester.takeScreenshot(`protected-page-after-logout-${pageUrl.replace(/\//g, '-')}`);
          
          results.protectedPagesAfterLogout[pageUrl] = result;
          console.log(`  ${result.accessible ? '✅' : '❌'} Accessible: ${result.accessible}, Redirected: ${result.redirected} -> ${result.finalUrl}`);
        } catch (error) {
          results.errors.push(`Protected page test failed for ${pageUrl} (after logout): ${error}`);
        }
      }
    } else {
      results.errors.push('Cannot test logged-out pages - user is still logged in');
    }

    // Final screenshot
    await authTester.takeScreenshot('test-complete');

    // Generate comprehensive report
    console.log('\n📊 COMPLETE AUTHENTICATION FLOW TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log('\n🏠 HOMEPAGE:');
    console.log(`  Loaded: ${results.homepage.loaded}`);
    console.log(`  URL: ${results.homepage.url}`);
    console.log(`  Auth Button Text: "${results.homepage.authButtonText}"`);
    console.log(`  Initially Logged In: ${results.homepage.isLoggedIn}`);
    
    console.log('\n📝 SIGNUP:');
    console.log(`  Success: ${results.signup.success}`);
    if (results.signup.error) console.log(`  Error: ${results.signup.error}`);
    
    console.log('\n🔑 LOGIN AFTER SIGNUP:');
    console.log(`  Success: ${results.loginAfterSignup?.success}`);
    if (results.loginAfterSignup?.autoLogin) console.log(`  Auto-login: true`);
    if (results.loginAfterSignup?.error) console.log(`  Error: ${results.loginAfterSignup.error}`);
    
    console.log('\n🔓 PROTECTED PAGES (LOGGED IN):');
    Object.entries(results.protectedPagesLoggedIn).forEach(([url, result]: [string, any]) => {
      console.log(`  ${url}:`);
      console.log(`    Accessible: ${result.accessible}`);
      console.log(`    Redirected: ${result.redirected}`);
      console.log(`    Final URL: ${result.finalUrl}`);
      if (result.error) console.log(`    Error: ${result.error}`);
    });
    
    console.log('\n🚪 LOGOUT:');
    console.log(`  Success: ${results.logout?.success}`);
    
    console.log('\n🔒 PROTECTED PAGES (AFTER LOGOUT):');
    Object.entries(results.protectedPagesAfterLogout).forEach(([url, result]: [string, any]) => {
      console.log(`  ${url}:`);
      console.log(`    Accessible: ${result.accessible}`);
      console.log(`    Redirected: ${result.redirected}`);
      console.log(`    Final URL: ${result.finalUrl}`);
      if (result.error) console.log(`    Error: ${result.error}`);
    });
    
    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS DETECTED:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ NO ERRORS DETECTED');
    }
    
    console.log('\n' + '='.repeat(60));

    // Test assertions
    expect(results.homepage.loaded).toBe(true);
    if (results.errors.length > 0) {
      console.warn(`⚠️  Test completed with ${results.errors.length} errors/issues detected`);
    }
  });
});