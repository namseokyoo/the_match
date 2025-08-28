const { chromium } = require('playwright');

async function createTestMatches() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to matches creation page...');
    await page.goto('http://localhost:3000/matches');
    await page.waitForTimeout(2000);

    // Try to find and click the create match button
    const createButton = page.locator('text=경기 생성').or(page.locator('text=새 경기')).or(page.locator('[data-testid="create-match-btn"]')).first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of create form
      await page.screenshot({ path: 'create-match-form.png', fullPage: true });
      console.log('Screenshot taken: create-match-form.png');

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
        },
        {
          title: "Single Elimination 테스트 대회",
          description: "단일 토너먼트 방식의 테스트 경기입니다",
          type: "single_elimination"
        }
      ];

      for (let i = 0; i < testMatches.length; i++) {
        const match = testMatches[i];
        console.log(`Creating match: ${match.title}`);

        // Fill the form
        await page.fill('input[name="title"], input[placeholder*="제목"], input[placeholder*="이름"]', match.title);
        await page.waitForTimeout(500);
        
        await page.fill('textarea[name="description"], textarea[placeholder*="설명"], textarea[placeholder*="내용"]', match.description);
        await page.waitForTimeout(500);

        // Try to select match type
        const typeSelector = page.locator('select[name="type"]').or(page.locator('[data-testid="match-type-select"]')).first();
        if (await typeSelector.isVisible()) {
          await typeSelector.selectOption(match.type);
        }
        await page.waitForTimeout(500);

        // Try to submit
        const submitButton = page.locator('button[type="submit"]').or(page.locator('text=생성')).or(page.locator('text=저장')).first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(3000); // Wait for navigation
          
          // If successful, go back to create another match
          if (i < testMatches.length - 1) {
            await page.goto('http://localhost:3000/matches');
            await page.waitForTimeout(2000);
            await createButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }

    } else {
      console.log('Create match button not found. Checking current page...');
      await page.screenshot({ path: 'current-page.png', fullPage: true });
    }

  } catch (error) {
    console.error('Error creating test matches:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

createTestMatches();