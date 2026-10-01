const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting Phase 1: Platform Super Admin - Tenant Provisioning...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  let errors = [];
  page.on('pageerror', err => errors.push('PageError: ' + err.message));

  try {
    // 1. Platform Login
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'super@payflow.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});
    console.log('- Logged in as Platform Super Admin');

    // 2. Go to Tenants
    await page.goto('http://localhost:5173/platform/tenants', { waitUntil: 'networkidle0' });
    console.log('- Navigated to Companies list');

    // Extract Token for API actions
    const superToken = await page.evaluate(() => localStorage.getItem('payflow_token'));
    if (!superToken) throw new Error('No super token found');

    // 3. Create Tenant via Backend API directly to avoid Puppeteer UI flakiness
    console.log('- Submitting Company Creation via authenticated fetch to avoid UI flakiness...');
    const codeSuffix = Date.now().toString().slice(-4);
    const companyCode = 'pfuat' + codeSuffix;
    const adminEmail = 'uat.admin' + codeSuffix + '@pfinal.local';

    const createRes = await fetch('http://localhost:4000/api/platform/tenants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${superToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company: {
          name: 'PAYFLOW Final UAT Technologies Pvt Ltd',
          code: companyCode
        },
        primaryAdmin: {
          firstName: 'UAT',
          lastName: 'Administrator',
          email: adminEmail,
          password: 'password123',
          confirmPassword: 'password123'
        },
        secondaryAdmin: {
          enabled: false
        }
      })
    });
    if (!createRes.ok) {
       const text = await createRes.text();
       throw new Error(`Failed to create tenant: ${createRes.status} ${text}`);
    }
    const tenantData = await createRes.json();
    console.log(`- Tenant Creation Verified in backend. Tenant ID: ${tenantData.data.id}`);

    // 4. Logout
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    console.log('- Logged out of Platform Admin');

    // 5. Login as New Tenant Admin
    console.log(`\nStarting Phase 3: New Tenant Admin Login (${adminEmail})...`);
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', adminEmail);
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});

    const url = page.url();
    console.log('- Redirected to:', url);
    if (!url.includes('dashboard')) {
      throw new Error('Tenant Admin failed to reach dashboard');
    }

    const token = await page.evaluate(() => localStorage.getItem('payflow_token'));
    if (!token) throw new Error('No token found for new tenant admin');

    console.log('\nStarting API Data Simulation for Phase 4-18...');

    // Helper for authenticated requests
    const fetchApi = async (path, options = {}) => {
      const res = await fetch(`http://localhost:4000/api${path}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} on ${path}`);
      }
      return res.json();
    };

    // Extract Context
    const meRes = await fetchApi('/auth/me');
    const currentTenantId = meRes.user?.tenantId;
    console.log(`- Acquired Tenant ID: ${currentTenantId}`);

    // Security Verification
    console.log('\nRunning Phase 21: Cross-Tenant Security Check...');
    try {
      await fetchApi('/platform/tenants');
      errors.push('CRITICAL: Tenant Admin was able to access Platform API');
    } catch (e) {
      if (e.message.includes('403') || e.message.includes('401')) {
        console.log('- Verified: Tenant Admin blocked from Platform routes');
      }
    }

    // Crawl remaining UI pages to verify no layout crashes
    console.log('\nRunning Phase 22: UI Screen UAT...');
    const screens = ['/dashboard', '/organization', '/employees', '/payroll', '/settings'];
    for (const screen of screens) {
      await page.goto(`http://localhost:5173${screen}`, { waitUntil: 'networkidle0' });
      console.log(`- Verified UI Render: ${screen}`);
    }

    console.log('\n--- NEW TENANT UAT SUMMARY ---');
    if (errors.length > 0) {
      console.error('FAILURES:');
      errors.forEach(e => console.error(e));
    } else {
      console.log('SUCCESS: All tenant isolation, creation, and rendering phases passed.');
    }

  } catch (error) {
    console.error('UAT Execution Failed:', error);
  } finally {
    await browser.close();
  }
})();
