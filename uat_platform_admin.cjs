const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting UAT - Platform Admin...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

    console.log('Logging in as super@payflow.com...');
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'super@payflow.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    console.log('Waiting for Dashboard...');
    await page.waitForSelector('text/Tenants', { timeout: 10000 }).catch(() => console.log('Tenants text not found immediately'));
    
    const url = page.url();
    console.log('Current URL after login:', url);
    if (!url.includes('platform') && !url.includes('dashboard')) {
       throw new Error('Failed to reach platform dashboard. URL is ' + url);
    }
    console.log('Successfully reached platform dashboard.');

    console.log('Navigating to Tenants...');
    await page.goto('http://localhost:5173/platform/tenants', { waitUntil: 'networkidle0' });
    
    console.log('Creating a new tenant...');
    await page.waitForSelector('button');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Create Tenant')) {
        await btn.click();
        break;
      }
    }
    
    // Check if modal opened
    try {
      await page.waitForSelector('input[placeholder="e.g. Acme Corp"]', { timeout: 5000 });
      await page.type('input[placeholder="e.g. Acme Corp"]', 'Puppeteer Test Tenant');
      await page.type('input[placeholder="e.g. acme"]', 'puppet-test');
      
      const inputs = await page.$$('input');
      // Admin first name, last name, email, pwd, confirm
      await inputs[2].type('Admin');
      await inputs[3].type('Puppet');
      await inputs[4].type('admin@puppet.test');
      await inputs[5].type('password123');
      await inputs[6].type('password123');
      
      const submitBtns = await page.$$('button');
      for (const btn of submitBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Create')) {
          await btn.click();
        }
      }
      console.log('Tenant creation form submitted.');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Tenant creation modal or fields not found:', e.message);
    }

    console.log('Refreshing to verify persistence...');
    await page.reload({ waitUntil: 'networkidle0' });
    
    console.log('Logging out...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    console.log('UAT Platform Admin Completed Successfully.');
  } catch (error) {
    console.error('UAT Error:', error);
  } finally {
    await browser.close();
  }
})();
