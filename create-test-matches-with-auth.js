const { chromium } = require('playwright');

async function createTestMatchesWithAuth() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to home page...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Check if we need to login
    const loginButton = page.locator('text=로그인').or(page.locator('text=Login')).first();
    if (await loginButton.isVisible()) {
      console.log('Login required, attempting to login...');
      await loginButton.click();
      await page.waitForTimeout(2000);

      // Try to create a test account or login with test credentials
      // First check if there's a signup option
      const signupButton = page.locator('text=회원가입').or(page.locator('text=Sign up')).first();
      if (await signupButton.isVisible()) {
        console.log('Creating test account...');
        await signupButton.click();
        await page.waitForTimeout(1000);

        // Fill signup form
        await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
        await page.fill('input[type="password"], input[name="password"]', 'testpass123');
        
        const submitBtn = page.locator('button[type="submit"]').or(page.locator('text=회원가입')).first();
        await submitBtn.click();
        await page.waitForTimeout(3000);
      } else {
        // Try to login with test credentials
        console.log('Attempting login with test credentials...');
        await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
        await page.fill('input[type="password"], input[name="password"]', 'testpass123');
        
        const loginSubmit = page.locator('button[type="submit"]').or(page.locator('text=로그인')).first();
        await loginSubmit.click();
        await page.waitForTimeout(3000);
      }
    }

    // Navigate to matches page
    console.log('Navigating to matches page...');
    await page.goto('http://localhost:3000/matches');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'matches-page-after-auth.png', fullPage: true });
    console.log('Screenshot taken: matches-page-after-auth.png');

    // Check if we can now create matches
    const createMatchButton = page.locator('text=경기 생성').or(page.locator('text=새 경기')).or(page.locator('[href*="create"]')).first();
    
    if (await createMatchButton.isVisible()) {
      console.log('Create match button found, proceeding to create test matches...');
      
      // Test matches data
      const testMatches = [
        {
          title: "Round Robin 테스트 대회",
          description: "라운드 로빈 방식의 테스트 경기입니다",
          type: "round_robin"
        },
        {
          title: "Swiss System 테스트 대회", 
          description: "스위스 시스템 방식의 테스트 경기입니다",
          type: "swiss"
        },
        {
          title: "League 테스트 대회",
          description: "리그 방식의 테스트 경기입니다", 
          type: "league"
        }
      ];

      for (let i = 0; i < testMatches.length; i++) {
        const match = testMatches[i];
        console.log(`Creating match ${i + 1}: ${match.title}`);

        await createMatchButton.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: `create-form-${i + 1}.png`, fullPage: true });

        // Try different input selectors
        const titleInput = page.locator('input[name="title"]').or(page.locator('#title')).or(page.locator('[placeholder*="제목"]')).or(page.locator('[placeholder*="이름"]')).first();
        
        if (await titleInput.isVisible()) {
          await titleInput.fill(match.title);
          console.log(`Filled title: ${match.title}`);
        }

        const descInput = page.locator('textarea[name="description"]').or(page.locator('#description')).or(page.locator('[placeholder*="설명"]')).first();
        if (await descInput.isVisible()) {
          await descInput.fill(match.description);
          console.log(`Filled description: ${match.description}`);
        }

        // Try to select match type
        const typeSelect = page.locator('select[name="type"]').or(page.locator('#type')).first();
        if (await typeSelect.isVisible()) {
          await typeSelect.selectOption(match.type);
          console.log(`Selected type: ${match.type}`);
        }

        // Submit form
        const submitButton = page.locator('button[type="submit"]').or(page.locator('text=생성')).or(page.locator('text=저장')).first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(3000);
          console.log('Match created successfully');
        }

        // Navigate back to matches list
        await page.goto('http://localhost:3000/matches');
        await page.waitForTimeout(2000);
      }

      // Take final screenshot of matches list
      await page.screenshot({ path: 'matches-final-list.png', fullPage: true });
      console.log('Final matches list screenshot taken');

    } else {
      console.log('Create match button not found after authentication');
      // Take screenshot to debug
      await page.screenshot({ path: 'no-create-button.png', fullPage: true });
    }

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'error-final.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

createTestMatchesWithAuth();