import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  console.log('Navigating to http://alex-frontend:3000/catalogue...');
  await page.goto('http://alex-frontend:3000/catalogue', { waitUntil: 'networkidle' });
  console.log('Page loaded successfully');
  console.log('Page title:', await page.title());
  console.log('Page URL:', page.url());
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/catalogue-page.png', fullPage: true });
  console.log('Screenshot saved');
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await browser.close();
}
