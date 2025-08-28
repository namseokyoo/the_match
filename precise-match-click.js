const { chromium } = require('playwright');

async function preciseMatchClick() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to matches page...');
    await page.goto('http://localhost:3000/matches');
    await page.waitForTimeout(3000);

    // Look for the match cards by targeting the entire row/card area
    console.log('Looking for match cards...');
    
    // Try clicking on match cards by looking for elements with text content that includes our test matches
    const matchSelectors = [
      // Target the entire match card containers
      'div[class*="card"]',
      'div[class*="item"]', 
      'div[class*="row"]',
      // Target elements that contain match titles
      'div:has-text("테스트 경기")',
      'div:has-text("라운드 로빈")',
      'div:has-text("스위스")',
      'div:has-text("리그")'
    ];

    let clickedSuccessfully = false;

    // Try each selector approach
    for (const selector of matchSelectors) {
      try {
        console.log(`Trying selector: ${selector}`);
        const elements = await page.locator(selector).all();
        
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          
          // Try clicking the first few elements
          for (let i = 0; i < Math.min(3, elements.length); i++) {
            try {
              console.log(`Clicking element ${i + 1}...`);
              
              // Try to click the element and wait for navigation
              await Promise.race([
                elements[i].click(),
                page.waitForNavigation({ timeout: 5000 })
              ]);
              
              await page.waitForTimeout(2000);
              
              // Check if URL changed (indicating successful navigation)
              const currentUrl = page.url();
              console.log('Current URL:', currentUrl);
              
              if (currentUrl.includes('/matches/') && !currentUrl.endsWith('/matches')) {
                console.log('Successfully navigated to match detail page!');
                await page.screenshot({ path: `match-detail-success-${i + 1}.png`, fullPage: true });
                console.log(`Screenshot taken: match-detail-success-${i + 1}.png`);
                clickedSuccessfully = true;
                
                // Try to capture different sections/views of the match detail page
                await page.waitForTimeout(2000);
                
                // Look for tabs or navigation elements
                const tabs = await page.locator('button, a, div').filter({ hasText: /대진표|브래킷|참가자|결과|통계/ }).all();
                console.log(`Found ${tabs.length} potential tabs`);
                
                for (let j = 0; j < Math.min(3, tabs.length); j++) {
                  try {
                    await tabs[j].click();
                    await page.waitForTimeout(1500);
                    await page.screenshot({ path: `match-detail-tab-${j + 1}.png`, fullPage: true });
                    console.log(`Tab screenshot taken: match-detail-tab-${j + 1}.png`);
                  } catch (e) {
                    console.log(`Tab ${j + 1} click failed`);
                  }
                }
                
                break;
              } else {
                console.log('URL did not change, trying next element...');
              }
              
            } catch (error) {
              console.log(`Click ${i + 1} failed: ${error.message}`);
              continue;
            }
          }
          
          if (clickedSuccessfully) break;
        }
      } catch (error) {
        console.log(`Selector ${selector} failed: ${error.message}`);
        continue;
      }
    }

    // If none of the above worked, try a different approach - inspect the actual DOM
    if (!clickedSuccessfully) {
      console.log('Trying DOM inspection approach...');
      
      // Get all elements and look for ones that might be clickable match cards
      const allDivs = await page.locator('div').all();
      console.log(`Inspecting ${Math.min(20, allDivs.length)} div elements...`);
      
      for (let i = 0; i < Math.min(20, allDivs.length); i++) {
        try {
          const element = allDivs[i];
          const textContent = await element.textContent();
          
          if (textContent && textContent.includes('테스트') && textContent.length < 200) {
            console.log(`Found potential match element: "${textContent.substring(0, 50)}..."`);
            
            await element.click();
            await page.waitForTimeout(2000);
            
            if (page.url().includes('/matches/') && !page.url().endsWith('/matches')) {
              console.log('DOM inspection approach succeeded!');
              await page.screenshot({ path: `match-detail-dom-inspection.png`, fullPage: true });
              clickedSuccessfully = true;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
    }

    if (!clickedSuccessfully) {
      console.log('All approaches failed. Taking final debug screenshot...');
      await page.screenshot({ path: 'final-debug.png', fullPage: true });
    }

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'error-precise.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

preciseMatchClick();