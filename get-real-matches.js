const { chromium } = require('playwright');

async function getRealMatches() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Getting real match data...');
    
    // Get matches from API
    await page.goto('http://localhost:3000/api/matches');
    await page.waitForTimeout(2000);
    
    const apiResponseText = await page.textContent('body');
    console.log('Raw API Response:', apiResponseText.substring(0, 500));
    
    try {
      const apiResponse = JSON.parse(apiResponseText);
      console.log('Parsed API Response structure:', Object.keys(apiResponse));
      
      let matches = [];
      if (apiResponse.success && apiResponse.data) {
        matches = apiResponse.data;
      } else if (Array.isArray(apiResponse)) {
        matches = apiResponse;
      } else {
        console.log('Unexpected API response structure');
        return;
      }
      
      console.log(`Found ${matches.length} matches`);
      
      // Process each match
      for (let i = 0; i < Math.min(5, matches.length); i++) {
        const match = matches[i];
        console.log(`\nMatch ${i + 1}:`);
        console.log(`  ID: ${match.id}`);
        console.log(`  Title: ${match.title}`);
        console.log(`  Type: ${match.type}`);
        console.log(`  Status: ${match.status}`);
        
        try {
          const matchUrl = `http://localhost:3000/matches/${match.id}`;
          console.log(`  Navigating to: ${matchUrl}`);
          
          await page.goto(matchUrl);
          await page.waitForTimeout(4000);
          
          // Check if we got a valid page (not "not found")
          const pageContent = await page.textContent('body');
          if (pageContent.includes('경기를 찾을 수 없습니다') || pageContent.includes('Match not found')) {
            console.log(`  Match ${match.id} not found in database`);
            continue;
          }
          
          console.log(`  Successfully loaded match detail page`);
          
          // Take main screenshot
          const filename = `match-${match.type}-${match.id.substring(0, 8)}.png`;
          await page.screenshot({ path: filename, fullPage: true });
          console.log(`  Screenshot: ${filename}`);
          
          // Look for and click on different tabs/sections
          const potentialTabs = [
            'button:has-text("대진표")',
            'button:has-text("참가자")', 
            'button:has-text("결과")',
            'a:has-text("대진표")',
            'a:has-text("참가자")',
            'a:has-text("결과")',
            '[role="tab"]',
            'nav button',
            'nav a'
          ];
          
          for (const tabSelector of potentialTabs) {
            try {
              const tabs = await page.locator(tabSelector).all();
              if (tabs.length > 0) {
                console.log(`  Found ${tabs.length} elements with selector: ${tabSelector}`);
                
                for (let j = 0; j < Math.min(2, tabs.length); j++) {
                  try {
                    const tabText = await tabs[j].textContent();
                    console.log(`    Clicking tab: "${tabText}"`);
                    
                    await tabs[j].click();
                    await page.waitForTimeout(2000);
                    
                    const tabFilename = `match-${match.type}-${match.id.substring(0, 8)}-${tabText.replace(/[^\w가-힣]/g, '')}.png`;
                    await page.screenshot({ path: tabFilename, fullPage: true });
                    console.log(`    Tab screenshot: ${tabFilename}`);
                  } catch (tabError) {
                    console.log(`    Tab click failed: ${tabError.message}`);
                  }
                }
                break; // Found working tab selector, no need to try others
              }
            } catch (selectorError) {
              continue; // Try next selector
            }
          }
          
        } catch (matchError) {
          console.log(`  Error with match ${match.id}: ${matchError.message}`);
        }
      }
      
    } catch (parseError) {
      console.log('Failed to parse API response:', parseError.message);
      console.log('Raw response was:', apiResponseText);
    }

  } catch (error) {
    console.error('Script error:', error);
    await page.screenshot({ path: 'script-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

getRealMatches();