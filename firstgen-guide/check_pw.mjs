import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Browser console error:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.error('Browser page error:', error.message);
  });

  try {
    await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_screenshot.png' });
  } catch(e) {
    console.error("Navigation error:", e);
  } finally {
    await browser.close();
  }
})();
