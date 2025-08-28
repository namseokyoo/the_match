const { chromium } = require('playwright');

async function directNavigation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Getting match data from API...');
    
    // First try to get matches from the API endpoint
    try {
      await page.goto('http://localhost:3000/api/matches');
      await page.waitForTimeout(2000);
      
      const apiResponse = await page.textContent('body');
      console.log('API Response preview:', apiResponse.substring(0, 200));
      
      // Parse the JSON response
      const matches = JSON.parse(apiResponse);
      console.log(`Found ${matches.length} matches in API response`);
      
      // Take screenshots of the first few matches
      for (let i = 0; i < Math.min(5, matches.length); i++) {
        const match = matches[i];
        console.log(`Match ${i + 1}: ${match.title} (${match.type}) - ID: ${match.id}`);
        
        try {
          const matchUrl = `http://localhost:3000/matches/${match.id}`;
          console.log(`Navigating to: ${matchUrl}`);
          
          await page.goto(matchUrl);
          await page.waitForTimeout(3000);
          
          // Take screenshot
          await page.screenshot({ 
            path: `match-detail-${match.type}-${i + 1}.png`, 
            fullPage: true 
          });
          console.log(`Screenshot taken: match-detail-${match.type}-${i + 1}.png`);
          
          // Try to capture different views/tabs if they exist
          const tabs = await page.locator('button, a').filter({ 
            hasText: /대진표|브래킷|참가자|결과|통계|라운드|경기|팀/ 
          }).all();
          
          for (let j = 0; j < Math.min(3, tabs.length); j++) {
            try {
              console.log(`Clicking tab ${j + 1}...`);
              await tabs[j].click();
              await page.waitForTimeout(2000);
              
              await page.screenshot({ 
                path: `match-detail-${match.type}-${i + 1}-tab-${j + 1}.png`, 
                fullPage: true 
              });
              console.log(`Tab screenshot: match-detail-${match.type}-${i + 1}-tab-${j + 1}.png`);
            } catch (tabError) {
              console.log(`Tab ${j + 1} failed:`, tabError.message);
            }
          }
          
        } catch (matchError) {
          console.log(`Failed to navigate to match ${match.id}:`, matchError.message);
        }
      }
      
    } catch (apiError) {
      console.log('API approach failed:', apiError.message);
      
      // Fallback: Try to extract match IDs from the matches page HTML
      console.log('Trying HTML extraction fallback...');
      await page.goto('http://localhost:3000/matches');
      await page.waitForTimeout(3000);
      
      const content = await page.content();
      const matchIds = [...new Set(content.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g) || [])];
      
      console.log(`Found ${matchIds.length} match IDs in HTML:`, matchIds);
      
      for (let i = 0; i < Math.min(3, matchIds.length); i++) {
        try {
          const matchUrl = `http://localhost:3000/matches/${matchIds[i]}`;
          console.log(`Navigating to extracted match: ${matchUrl}`);
          
          await page.goto(matchUrl);
          await page.waitForTimeout(3000);
          
          await page.screenshot({ 
            path: `match-detail-extracted-${i + 1}.png`, 
            fullPage: true 
          });
          console.log(`Screenshot taken: match-detail-extracted-${i + 1}.png`);
          
        } catch (extractError) {
          console.log(`Failed to navigate to extracted match ${matchIds[i]}:`, extractError.message);
        }
      }
    }

    // Also try some common test URLs in case there are static test matches
    const testUrls = [
      'http://localhost:3000/matches/test-round-robin',
      'http://localhost:3000/matches/test-swiss', 
      'http://localhost:3000/matches/test-league',
      'http://localhost:3000/matches/1',
      'http://localhost:3000/matches/sample'
    ];
    
    console.log('Trying test URLs...');
    for (let i = 0; i < testUrls.length; i++) {
      try {
        await page.goto(testUrls[i]);
        await page.waitForTimeout(2000);
        
        // Check if page loaded successfully (not 404)
        const title = await page.title();
        if (!title.includes('404') && !title.includes('Not Found')) {
          console.log(`Test URL ${testUrls[i]} loaded successfully`);
          await page.screenshot({ 
            path: `test-url-${i + 1}.png`, 
            fullPage: true 
          });
        }
      } catch (testError) {
        console.log(`Test URL ${testUrls[i]} failed`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'error-direct-nav.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

directNavigation();