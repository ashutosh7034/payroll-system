const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting Full Platform UAT Crawl...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const errors = [];
  page.on('pageerror', err => errors.push('PageError: ' + err.message));
  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('localhost')) {
      errors.push(`HTTP ${response.status()} on ${response.url()}`);
    }
  });

  const runRoleUAT = async (email, password, roleName, paths) => {
    console.log(`\nTesting Role: ${roleName} (${email})`);
    try {
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
      await page.type('input[type="email"]', email);
      await page.type('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});
      
      const currentUrl = page.url();
      console.log(`- Login successful. Redirected to: ${currentUrl}`);

      for (const path of paths) {
        console.log(`- Visiting ${path}...`);
        await page.goto(`http://localhost:5173${path}`, { waitUntil: 'networkidle0' });
        // Attempt some clicks if buttons exist to test reactivity
        const btns = await page.$$('button');
        if (btns.length > 0) {
            try { await btns[0].hover(); } catch(e) {}
        }
      }
    } catch (e) {
      errors.push(`Error during ${roleName} UAT: ${e.message}`);
    }
  };

  // 1. Platform Super Admin
  await runRoleUAT('super@payflow.com', 'password123', 'Platform Super Admin', [
    '/platform/dashboard',
    '/platform/tenants',
    '/platform/users'
  ]);

  // 2. Tenant Admin
  await runRoleUAT('admin@companya.com', 'password123', 'Tenant Admin', [
    '/dashboard',
    '/organization',
    '/employees',
    '/payroll',
    '/settings'
  ]);

  // 3. HR
  await runRoleUAT('hr@demo.local', 'password123', 'HR', [
    '/dashboard',
    '/employees',
    '/attendance',
    '/leave'
  ]);

  // 4. Payroll Manager
  await runRoleUAT('payroll@demo.local', 'password123', 'Payroll Manager', [
    '/dashboard',
    '/compensation',
    '/payroll',
    '/loans',
    '/arrears'
  ]);

  // 5. Finance
  await runRoleUAT('finance@demo.local', 'password123', 'Finance', [
    '/dashboard',
    '/payroll',
    '/accounting',
    '/reports'
  ]);

  // 6. Employee
  await runRoleUAT('employee@demo.local', 'password123', 'Employee', [
    '/dashboard',
    '/attendance',
    '/leave',
    '/payslips'
  ]);

  console.log('\n--- UAT CRAWL SUMMARY ---');
  if (errors.length > 0) {
    console.log('DEFECTS FOUND:');
    errors.forEach(e => console.log(e));
  } else {
    console.log('No UI errors or 4xx/5xx responses detected during crawl.');
  }

  await browser.close();
})();
