const { chromium } = require('playwright');

async function screenshotMatchDetails() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to matches page...');
    await page.goto('http://localhost:3000/matches');
    await page.waitForTimeout(3000);

    // Get all match cards
    const matchCards = await page.locator('[data-testid="match-card"]').or(page.locator('.match-card')).or(page.locator('a[href*="/matches/"]')).all();
    
    if (matchCards.length === 0) {
      console.log('No match cards found, looking for other selectors...');
      // Try different selectors for match items
      const matchItems = await page.locator('div:has-text("테스트"), div:has-text("라운드"), div:has-text("스위스"), div:has-text("리그")').all();
      
      if (matchItems.length > 0) {
        console.log(`Found ${matchItems.length} match items using text selectors`);
        
        for (let i = 0; i < Math.min(5, matchItems.length); i++) {
          try {
            console.log(`Clicking match item ${i + 1}...`);
            await matchItems[i].click({ timeout: 5000 });
            await page.waitForTimeout(3000);
            
            // Take screenshot of match detail page
            await page.screenshot({ path: `match-detail-${i + 1}.png`, fullPage: true });
            console.log(`Screenshot taken: match-detail-${i + 1}.png`);
            
            // Go back to matches list
            await page.goBack();
            await page.waitForTimeout(2000);
          } catch (error) {
            console.log(`Error with match ${i + 1}:`, error.message);
            continue;
          }
        }
      } else {
        console.log('No match items found with text selectors either');
        await page.screenshot({ path: 'no-matches-found.png', fullPage: true });
      }
    } else {
      console.log(`Found ${matchCards.length} match cards`);
      
      for (let i = 0; i < Math.min(5, matchCards.length); i++) {
        try {
          console.log(`Clicking match card ${i + 1}...`);
          await matchCards[i].click({ timeout: 5000 });
          await page.waitForTimeout(3000);
          
          // Take screenshot of match detail page
          await page.screenshot({ path: `match-detail-card-${i + 1}.png`, fullPage: true });
          console.log(`Screenshot taken: match-detail-card-${i + 1}.png`);
          
          // Go back to matches list
          await page.goBack();
          await page.waitForTimeout(2000);
        } catch (error) {
          console.log(`Error with match card ${i + 1}:`, error.message);
          continue;
        }
      }
    }

    // Also try to navigate directly to specific match URLs if we can find them
    console.log('Trying direct navigation to match pages...');
    
    // Get current page content to find match URLs
    const content = await page.content();
    const matchUrlMatches = content.match(/\/matches\/[a-f0-9-]+/g);
    
    if (matchUrlMatches) {
      const uniqueUrls = [...new Set(matchUrlMatches)].slice(0, 3);
      console.log('Found match URLs:', uniqueUrls);
      
      for (let i = 0; i < uniqueUrls.length; i++) {
        try {
          const url = `http://localhost:3000${uniqueUrls[i]}`;
          console.log(`Navigating to: ${url}`);
          await page.goto(url);
          await page.waitForTimeout(3000);
          
          await page.screenshot({ path: `match-direct-${i + 1}.png`, fullPage: true });
          console.log(`Direct navigation screenshot taken: match-direct-${i + 1}.png`);
        } catch (error) {
          console.log(`Error navigating to ${uniqueUrls[i]}:`, error.message);
        }
      }
    }

  } catch (error) {
    console.error('Error taking screenshots:', error);
    await page.screenshot({ path: 'screenshot-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

screenshotMatchDetails();