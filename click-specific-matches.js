const { chromium } = require('playwright');

async function clickSpecificMatches() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to matches page...');
    await page.goto('http://localhost:3000/matches');
    await page.waitForTimeout(3000);

    // Take screenshot of current state
    await page.screenshot({ path: 'matches-before-click.png', fullPage: true });
    
    // Look for clickable match items - try various approaches
    const approaches = [
      // Approach 1: Look for specific match titles we created
      async () => {
        console.log('Trying approach 1: Specific match titles...');
        const roundRobinMatch = page.locator('text=Round Robin').or(page.locator('text=라운드'));
        if (await roundRobinMatch.isVisible()) {
          await roundRobinMatch.click();
          return true;
        }
        return false;
      },
      
      // Approach 2: Look for match cards with clickable areas
      async () => {
        console.log('Trying approach 2: Match card containers...');
        const matchCards = await page.locator('div').filter({ hasText: '테스트' }).all();
        if (matchCards.length > 0) {
          // Try to find a clickable parent
          const clickable = matchCards[0].locator('..').or(matchCards[0]);
          await clickable.click();
          return true;
        }
        return false;
      },
      
      // Approach 3: Look for links
      async () => {
        console.log('Trying approach 3: Links...');
        const links = await page.locator('a').all();
        for (const link of links) {
          const href = await link.getAttribute('href');
          if (href && href.includes('/matches/') && !href.endsWith('/matches')) {
            await link.click();
            return true;
          }
        }
        return false;
      },
      
      // Approach 4: Direct navigation if we can find URLs in the page source
      async () => {
        console.log('Trying approach 4: Direct navigation...');
        const content = await page.content();
        const matchId = content.match(/\/matches\/([a-f0-9-]+)/);
        if (matchId) {
          await page.goto(`http://localhost:3000/matches/${matchId[1]}`);
          return true;
        }
        return false;
      }
    ];

    let success = false;
    for (let i = 0; i < approaches.length && !success; i++) {
      try {
        success = await approaches[i]();
        if (success) {
          console.log(`Approach ${i + 1} succeeded!`);
          await page.waitForTimeout(3000);
          
          // Take screenshot of match detail page
          await page.screenshot({ path: `match-detail-approach-${i + 1}.png`, fullPage: true });
          console.log(`Match detail screenshot taken: match-detail-approach-${i + 1}.png`);
          
          // Try to click through different sections/tabs if they exist
          const tabs = await page.locator('button, a').filter({ hasText: /대진표|브래킷|결과|통계|참가자/ }).all();
          for (let j = 0; j < Math.min(3, tabs.length); j++) {
            try {
              await tabs[j].click();
              await page.waitForTimeout(2000);
              await page.screenshot({ path: `match-detail-approach-${i + 1}-tab-${j + 1}.png`, fullPage: true });
              console.log(`Tab screenshot taken: match-detail-approach-${i + 1}-tab-${j + 1}.png`);
            } catch (e) {
              console.log(`Tab ${j + 1} click failed:`, e.message);
            }
          }
          
          break;
        }
      } catch (error) {
        console.log(`Approach ${i + 1} failed:`, error.message);
      }
    }

    if (!success) {
      console.log('All approaches failed. Taking debug screenshot...');
      await page.screenshot({ path: 'all-approaches-failed.png', fullPage: true });
      
      // Print page content for debugging
      const content = await page.content();
      console.log('Page contains match URLs:', content.includes('/matches/'));
      
      // Try to find all clickable elements
      const clickableElements = await page.locator('a, button, [role="button"], [onclick]').all();
      console.log(`Found ${clickableElements.length} potentially clickable elements`);
    }

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'error-click-matches.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

clickSpecificMatches();