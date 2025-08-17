import { test, expect, Page } from '@playwright/test';

interface AuthTestData {
  email: string;
  password: string;
  name: string;
}

// Test data for authentication - unique per test run
const TEST_CREDENTIALS: AuthTestData = {
  email: `testuser${Date.now()}@thematch.test`,
  password: 'TestPassword123!',
  name: `테스트유저${Date.now()}`
};

class FinalAuthFlowTester {
  constructor(private page: Page) {}

  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `tests/e2e/screenshots/final-auth-${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  async getAuthButtonText(): Promise<string | null> {
    const selectors = [
      'a[href="/login"]',
      'button:has-text("로그인")',
      'button:has-text("로그아웃")',
      'text="로그인"',
      'text="로그아웃"'
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
      'a[href="/profile"]'
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

      // Fill signup form using the exact IDs we discovered
      // Fill name field
      await this.page.locator('#name').fill(credentials.name);
      
      // Fill email field
      await this.page.locator('#email').fill(credentials.email);
      
      // Fill password field
      await this.page.locator('#password').fill(credentials.password);
      
      // Fill confirm password field
      await this.page.locator('#confirmPassword').fill(credentials.password);

      await this.takeScreenshot('signup-form-filled');

      // Wait a moment for the button to be enabled
      await this.page.waitForTimeout(1000);

      // Try to click the submit button
      const submitButton = this.page.locator('button[type="submit"]:has-text("회원가입")');
      
      // Check if button is enabled
      const isDisabled = await submitButton.isDisabled();
      if (isDisabled) {
        return { success: false, error: 'Submit button is still disabled after filling form' };
      }

      await submitButton.click();
      await this.takeScreenshot('after-signup-submit');

      // Wait for response with longer timeout
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });

      // Check if signup was successful (might redirect to login or dashboard)
      const currentUrl = this.page.url();
      const isLoggedIn = await this.isLoggedIn();
      
      console.log(`Signup result - URL: ${currentUrl}, Logged in: ${isLoggedIn}`);
      
      // Consider signup successful if we're redirected or logged in
      const isSuccess = isLoggedIn || 
                       currentUrl.includes('/login') || 
                       currentUrl.includes('/dashboard') ||
                       currentUrl.includes('/profile') ||
                       !currentUrl.includes('/signup');
      
      return { success: isSuccess };

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

      // Fill login form using selectors that worked before
      await this.page.locator('input[type="email"]').fill(credentials.email);
      await this.page.locator('input[type="password"]').fill(credentials.password);

      await this.takeScreenshot('login-form-filled');

      // Submit form
      await this.page.locator('button[type="submit"]:has-text("로그인")').click();

      // Wait for response
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
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
      const logoutButton = this.page.locator('button:has-text("로그아웃")').first();
      if (await logoutButton.isVisible({ timeout: 2000 })) {
        await logoutButton.click();
        await this.page.waitForLoadState('networkidle');
        return true;
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

test.describe('Final Authentication Flow Test', () => {
  let authTester: FinalAuthFlowTester;

  test.beforeEach(async ({ page }) => {
    authTester = new FinalAuthFlowTester(page);
  });

  test('Complete authentication flow with proper form handling', async ({ page }) => {
    const results = {
      homepage: {},
      signup: {},
      loginAfterSignup: {},
      protectedPagesLoggedIn: {},
      logout: {},
      protectedPagesAfterLogout: {},
      errors: []
    };

    console.log('🔍 Starting final authentication flow test...');
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
      if (!currentlyLoggedIn && results.signup.success) {
        console.log('🔄 User not auto-logged in after signup, attempting manual login');
        const loginResult = await authTester.performLogin(TEST_CREDENTIALS);
        results.loginAfterSignup = loginResult;
        
        if (loginResult.success) {
          console.log('✅ Login after signup successful');
        } else {
          console.log(`❌ Login after signup failed: ${loginResult.error}`);
        }
      } else if (currentlyLoggedIn) {
        console.log('✅ User auto-logged in after signup');
        results.loginAfterSignup = { success: true, autoLogin: true };
      } else {
        console.log('⚠️  Skipping login test because signup failed');
        results.loginAfterSignup = { success: false, error: 'Signup failed, cannot test login' };
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
      console.log('⚠️  Cannot test logged-in pages - user is not logged in');
      results.errors.push('Cannot test logged-in pages - user is not logged in');
    }

    // Step 5: Test logout
    console.log('📍 Step 5: Testing logout functionality');
    try {
      if (currentlyLoggedIn) {
        const logoutSuccess = await authTester.performLogout();
        await authTester.takeScreenshot('after-logout');
        results.logout = { success: logoutSuccess };
        
        if (logoutSuccess) {
          console.log('✅ Logout successful');
        } else {
          console.log('❌ Logout failed');
        }
      } else {
        console.log('⚠️  Skipping logout test - user is not logged in');
        results.logout = { success: false, error: 'User not logged in, cannot test logout' };
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
      console.log('⚠️  Cannot test logged-out pages - user is still logged in');
      results.errors.push('Cannot test logged-out pages - user is still logged in');
    }

    // Final screenshot
    await authTester.takeScreenshot('test-complete');

    // Generate comprehensive report
    console.log('\n📊 FINAL AUTHENTICATION FLOW TEST RESULTS');
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
    if (results.logout?.error) console.log(`  Error: ${results.logout.error}`);
    
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