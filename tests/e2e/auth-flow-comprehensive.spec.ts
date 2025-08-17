import { test, expect, Page } from '@playwright/test';

interface AuthTestData {
  email: string;
  password: string;
  nickname?: string;
}

// Test data for authentication
const TEST_CREDENTIALS: AuthTestData = {
  email: 'testuser@thematch.test',
  password: 'TestPassword123!',
  nickname: '테스트유저'
};

class AuthFlowTester {
  constructor(private page: Page) {}

  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `tests/e2e/screenshots/auth-flow-${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  async getAuthButtonText(): Promise<string | null> {
    // Check multiple possible selectors for auth buttons
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
        // Continue to next selector
        continue;
      }
    }
    return null;
  }

  async isLoggedIn(): Promise<boolean> {
    // Check for logout button or user profile elements
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

  async performLogin(credentials: AuthTestData): Promise<{ success: boolean; error?: string }> {
    try {
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
      return { success: isLoggedIn };

    } catch (error) {
      await this.takeScreenshot('login-error');
      return { success: false, error: String(error) };
    }
  }

  async testProtectedPageAccess(url: string): Promise<{ accessible: boolean; redirected: boolean; finalUrl: string; error?: string }> {
    try {
      const initialUrl = this.page.url();
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

test.describe('Authentication Flow Comprehensive Test', () => {
  let authTester: AuthFlowTester;

  test.beforeEach(async ({ page }) => {
    authTester = new AuthFlowTester(page);
  });

  test('Complete authentication flow analysis', async ({ page }) => {
    const results = {
      homepage: {},
      initialAuth: {},
      protectedPagesLoggedOut: {},
      loginFlow: {},
      protectedPagesLoggedIn: {},
      authConsistency: {},
      errors: []
    };

    console.log('🔍 Starting comprehensive authentication flow test...');

    // Step 1: Navigate to homepage and capture initial state
    console.log('📍 Step 1: Checking homepage and initial auth state');
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
      console.log(`❌ Homepage loading failed: ${error}`);
    }

    // Step 2: If logged in, logout first to test from clean state
    console.log('📍 Step 2: Ensuring clean logged-out state');
    try {
      const isLoggedIn = await authTester.isLoggedIn();
      if (isLoggedIn) {
        const logoutSuccess = await authTester.performLogout();
        await authTester.takeScreenshot('after-logout');
        console.log(`🔓 Logout ${logoutSuccess ? 'successful' : 'failed'}`);
      } else {
        console.log('✅ Already logged out');
      }
    } catch (error) {
      results.errors.push(`Logout process failed: ${error}`);
    }

    // Step 3: Test access to protected pages when not logged in
    console.log('📍 Step 3: Testing protected page access (logged out)');
    const protectedPages = ['/profile', '/dashboard', '/matches/create', '/teams/create'];
    
    for (const pageUrl of protectedPages) {
      try {
        console.log(`🔒 Testing access to ${pageUrl} (logged out)`);
        const result = await authTester.testProtectedPageAccess(pageUrl);
        await authTester.takeScreenshot(`protected-page-loggedout-${pageUrl.replace(/\//g, '-')}`);
        
        results.protectedPagesLoggedOut[pageUrl] = result;
        console.log(`  ${result.accessible ? '✅' : '❌'} Accessible: ${result.accessible}, Redirected: ${result.redirected} -> ${result.finalUrl}`);
      } catch (error) {
        results.errors.push(`Protected page test failed for ${pageUrl}: ${error}`);
      }
    }

    // Step 4: Test login flow
    console.log('📍 Step 4: Testing login flow');
    try {
      const loginResult = await authTester.performLogin(TEST_CREDENTIALS);
      results.loginFlow = loginResult;
      
      if (loginResult.success) {
        console.log('✅ Login successful');
      } else {
        console.log(`❌ Login failed: ${loginResult.error}`);
      }
    } catch (error) {
      results.errors.push(`Login flow failed: ${error}`);
    }

    // Step 5: Test access to protected pages when logged in
    console.log('📍 Step 5: Testing protected page access (logged in)');
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
      results.errors.push('Cannot test logged-in pages - login was not successful');
    }

    // Step 6: Check for redirect loops and authentication errors
    console.log('📍 Step 6: Checking for redirect loops and auth consistency');
    try {
      // Test rapid navigation between pages to detect loops
      const navigationTests = [
        { from: '/', to: '/login' },
        { from: '/login', to: '/signup' },
        { from: '/signup', to: '/' },
        { from: '/', to: '/profile' },
        { from: '/profile', to: '/dashboard' }
      ];

      for (const nav of navigationTests) {
        try {
          await page.goto(nav.from);
          await page.waitForLoadState('networkidle');
          const urlBefore = page.url();
          
          await page.goto(nav.to);
          await page.waitForLoadState('networkidle');
          const urlAfter = page.url();
          
          // Check for potential redirect loop (URL changing unexpectedly)
          const redirectCount = urlAfter.split('redirect').length - 1;
          if (redirectCount > 2) {
            results.errors.push(`Potential redirect loop detected: ${nav.from} -> ${nav.to} resulted in ${urlAfter}`);
          }
        } catch (error) {
          results.errors.push(`Navigation test failed ${nav.from} -> ${nav.to}: ${error}`);
        }
      }

      // Check authentication state consistency
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const homeAuthState = await authTester.isLoggedIn();
      
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      const profileAuthState = await authTester.isLoggedIn();
      
      results.authConsistency = {
        homeAuthState,
        profileAuthState,
        consistent: homeAuthState === profileAuthState
      };
      
      if (!results.authConsistency.consistent) {
        results.errors.push(`Authentication state inconsistent: Home(${homeAuthState}) vs Profile(${profileAuthState})`);
      }
      
    } catch (error) {
      results.errors.push(`Redirect loop check failed: ${error}`);
    }

    // Final screenshot
    await authTester.takeScreenshot('test-complete');

    // Generate comprehensive report
    console.log('\n📊 COMPREHENSIVE AUTHENTICATION FLOW TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log('\n🏠 HOMEPAGE:');
    console.log(`  Loaded: ${results.homepage.loaded}`);
    console.log(`  URL: ${results.homepage.url}`);
    console.log(`  Auth Button Text: "${results.homepage.authButtonText}"`);
    console.log(`  Initially Logged In: ${results.homepage.isLoggedIn}`);
    
    console.log('\n🔒 PROTECTED PAGES (LOGGED OUT):');
    Object.entries(results.protectedPagesLoggedOut).forEach(([url, result]: [string, any]) => {
      console.log(`  ${url}:`);
      console.log(`    Accessible: ${result.accessible}`);
      console.log(`    Redirected: ${result.redirected}`);
      console.log(`    Final URL: ${result.finalUrl}`);
      if (result.error) console.log(`    Error: ${result.error}`);
    });
    
    console.log('\n🔑 LOGIN FLOW:');
    console.log(`  Success: ${results.loginFlow.success}`);
    if (results.loginFlow.error) console.log(`  Error: ${results.loginFlow.error}`);
    
    console.log('\n🔓 PROTECTED PAGES (LOGGED IN):');
    Object.entries(results.protectedPagesLoggedIn).forEach(([url, result]: [string, any]) => {
      console.log(`  ${url}:`);
      console.log(`    Accessible: ${result.accessible}`);
      console.log(`    Redirected: ${result.redirected}`);
      console.log(`    Final URL: ${result.finalUrl}`);
      if (result.error) console.log(`    Error: ${result.error}`);
    });
    
    console.log('\n🔄 AUTHENTICATION CONSISTENCY:');
    console.log(`  Consistent: ${results.authConsistency.consistent}`);
    console.log(`  Home State: ${results.authConsistency.homeAuthState}`);
    console.log(`  Profile State: ${results.authConsistency.profileAuthState}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS DETECTED:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ NO ERRORS DETECTED');
    }
    
    console.log('\n' + '='.repeat(60));

    // Assertions for test validation
    expect(results.homepage.loaded).toBe(true);
    if (results.errors.length > 0) {
      console.warn(`⚠️  Test completed with ${results.errors.length} errors/issues detected`);
    }
  });
});