const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to catalogue page
    console.log('Navigating to http://alex-frontend:3000/catalogue...');
    await page.goto('http://alex-frontend:3000/catalogue', { waitUntil: 'networkidle' });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of catalogue page
    console.log('Taking screenshot of catalogue page...');
    await page.screenshot({ path: '/evidence/task-8-catalogue-page.png', fullPage: true });
    console.log('Screenshot saved: task-8-catalogue-page.png');
    
    // Look for "Nouvelle" button and click it
    console.log('Looking for Nouvelle button...');
    const nouvelleButton = await page.locator('button:has-text("Nouvelle")').first();
    
    if (await nouvelleButton.isVisible()) {
      console.log('Found Nouvelle button, clicking...');
      await nouvelleButton.click();
      
      // Wait for dialog to appear
      await page.waitForTimeout(1000);
      
      // Take screenshot of create gamme dialog
      console.log('Taking screenshot of create gamme dialog...');
      await page.screenshot({ path: '/evidence/task-8-create-gamme-dialog.png', fullPage: true });
      console.log('Screenshot saved: task-8-create-gamme-dialog.png');
      
      // Close the dialog by pressing Escape
      await page.press('body', 'Escape');
      console.log('Dialog closed');
    } else {
      console.log('Nouvelle button not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
