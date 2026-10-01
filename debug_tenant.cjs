const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'super@payflow.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});
  
  await page.goto('http://localhost:5173/platform/tenants', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'tenants_before_click.png' });
  
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Onboard Company')) {
      await btn.click();
      console.log('Clicked Onboard Company button');
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'tenants_after_click.png' });
  
  await browser.close();
})();
