const { chromium } = require('playwright');

async function testMatches() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to matches page...');
    await page.goto('http://localhost:3000/matches');
    await page.waitForTimeout(2000);
    
    // Take screenshot of matches page
    await page.screenshot({ path: 'matches-page.png', fullPage: true });
    console.log('Screenshot taken: matches-page.png');
    
    // Check for existing matches
    const matchCards = await page.locator('[data-testid="match-card"]').count();
    console.log(`Found ${matchCards} matches on the page`);
    
    if (matchCards > 0) {
      // Get match types
      const matchTypes = await page.locator('[data-testid="match-type"]').allTextContents();
      console.log('Match types found:', matchTypes);
      
      // Take screenshots of first few matches
      for (let i = 0; i < Math.min(3, matchCards); i++) {
        const matchCard = page.locator('[data-testid="match-card"]').nth(i);
        await matchCard.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: `match-detail-${i + 1}.png`, fullPage: true });
        console.log(`Screenshot taken: match-detail-${i + 1}.png`);
        
        await page.goBack();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('No matches found. Need to create test matches.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testMatches();