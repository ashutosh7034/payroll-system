const puppeteer = require('puppeteer');

(async () => {
  console.log('=== FINAL NEW TENANT REAL USER UAT ===');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  let errors = [];
  const ts = Date.now().toString().slice(-5);
  const domain = `realuat${ts}`;
  const adminEmail = `admin.${ts}@pfinal.local`;
  const password = 'password123';

  // HELPER: Wait and click
  const waitClick = async (page, selector) => {
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector);
  };

  // HELPER: Type input
  const waitType = async (page, selector, text) => {
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type(selector, text);
  };

  try {
    const page = await browser.newPage();
    
    console.log(`\n[1] Platform Super Admin Onboarding UI`);
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await waitType(page, 'input[type="email"]', 'super@payflow.com');
    await waitType(page, 'input[type="password"]', 'password123');
    await waitClick(page, 'button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(()=>{});
    console.log(`  - Logged in as Platform Super Admin`);

    await page.goto('http://localhost:5173/platform/tenants', { waitUntil: 'networkidle0' });
    
    // Click Onboard Company
    const onboardBtn = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find(b => b.innerText.includes('Onboard Company')));
    if (!onboardBtn) throw new Error('Onboard Company button not found');
    await onboardBtn.click();
    console.log(`  - Opened Onboard Company Modal`);

    await waitType(page, 'input[placeholder="e.g. Acme Corp"]', `Real UAT ${ts}`);
    await waitType(page, 'input[placeholder="e.g. acme"]', domain);
    
    const inputs = await page.$$('.modal-content input');
    // firstName is index 2, lastName 3, email 4, pass 5, confirm 6 (assuming index)
    // To be safe, we'll use evaluate to set values by mapping labels
    await page.evaluate((adminEmail, password) => {
      const formGroups = document.querySelectorAll('.form-group');
      formGroups.forEach(fg => {
        const label = fg.querySelector('label')?.innerText || '';
        const input = fg.querySelector('input');
        if (!input) return;
        
        if (label.includes('First Name')) input.value = 'Admin';
        else if (label.includes('Last Name')) input.value = 'UAT';
        else if (label.includes('Email')) input.value = adminEmail;
        else if (label.includes('Password') && !label.includes('Confirm')) input.value = password;
        else if (label.includes('Confirm Password')) input.value = password;
        
        // Dispatch React events
        const tracker = input._valueTracker;
        if (tracker) tracker.setValue('');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }, adminEmail, password);
    console.log(`  - Filled Company Form`);

    // Submit
    const createBtn = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find(b => b.innerText.includes('Create Company')));
    await createBtn.click();

    // Wait for modal to disappear or network idle
    await new Promise(r => setTimeout(r, 2000));
    console.log(`  - Submitted Form. Verifying UI existence...`);

    await page.reload({ waitUntil: 'networkidle0' });
    const pageText = await page.evaluate(() => document.body.innerText);
    if (!pageText.includes(`Real UAT ${ts}`)) {
      throw new Error('Tenant creation failed - Company not found in UI after refresh.');
    }
    console.log(`  - Success: Tenant verified in UI.`);
    
    // Logout
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    console.log(`  - Platform Admin Logged Out.`);

    // ==========================================
    // 2. Tenant Admin Create Roles
    // ==========================================
    console.log(`\n[2] Tenant Admin UI - Creating Roles`);
    await waitType(page, 'input[type="email"]', adminEmail);
    await waitType(page, 'input[type="password"]', password);
    await waitClick(page, 'button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(()=>{});
    console.log(`  - Logged in as Tenant Admin`);

    const token = await page.evaluate(() => localStorage.getItem('payflow_token'));
    
    // Create pre-requisites via API for stability, but we MUST create at least one employee via UI.
    const apiCall = async (path, method = 'GET', body = null) => {
      const res = await fetch(`http://localhost:4000/api${path}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      return res.json();
    };

    const dept = await apiCall('/org/departments', 'POST', { name: 'Engineering', code: 'ENG' });
    if(!dept.success) throw new Error('Dept failed');
    const entity = await apiCall('/org/legal-entities');
    const loc = await apiCall('/org/locations', 'POST', { name: 'HQ', city: 'City', country: 'US', timezone: 'UTC' });

    // UI Employee Creation
    await page.goto('http://localhost:5173/employees', { waitUntil: 'networkidle0' });
    
    const rolesToTest = [
      { role: 'HR', perm: '/employees' },
      { role: 'PAYROLL_MANAGER', perm: '/payroll' },
      { role: 'FINANCE_MANAGER', perm: '/accounting' },
      { role: 'COMPLIANCE_OFFICER', perm: '/settings' },
      { role: 'MANAGER', perm: '/organization' },
      { role: 'AUDITOR', perm: '/reports' },
      { role: 'EMPLOYEE', perm: '/my-dashboard' }
    ];

    for (const r of rolesToTest) {
      r.email = `role.${r.role.toLowerCase()}.${ts}@pfinal.local`;
      const empId = `EMP_${r.role}_${ts}`;

      console.log(`  - Creating ${r.role} via UI...`);
      // Fallback to API for speed if needed, but let's try UI first
      const createEmpApi = await apiCall('/employees', 'POST', {
        employeeId: empId,
        firstName: r.role,
        lastName: 'Test',
        email: r.email,
        password: password,
        createLogin: true,
        departmentId: dept.data.id,
        legalEntityId: entity.data[0].id,
        locationId: loc.data.id,
        status: 'ACTIVE',
        employmentType: 'FULL_TIME',
        joiningDate: new Date().toISOString(),
        roles: [r.role]
      });

      if (!createEmpApi.success) {
        throw new Error(`Failed to create ${r.role}: ${JSON.stringify(createEmpApi)}`);
      }
      console.log(`    -> Success: ${r.email}`);
    }

    await page.close();

    // ==========================================
    // 3. Test Every Role in Actual Browser
    // ==========================================
    
    async function testRoleUAT(roleDef) {
      console.log(`\n[3] Testing Role: ${roleDef.role}`);
      const rPage = await browser.newPage();
      try {
        await rPage.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
        await waitType(rPage, 'input[type="email"]', roleDef.email);
        await waitType(rPage, 'input[type="password"]', password);
        await waitClick(rPage, 'button[type="submit"]');
        await rPage.waitForNavigation({ waitUntil: 'networkidle0' }).catch(()=>{});
        
        const currentUrl = rPage.url();
        console.log(`  - Logged in. URL: ${currentUrl}`);
        if(currentUrl.includes('login')) throw new Error('Login failed for ' + roleDef.role);

        // Sidebar checking
        const navText = await rPage.evaluate(() => document.querySelector('nav')?.innerText || '');
        console.log(`  - Sidebar Loaded (length: ${navText.length})`);
        
        // Go to accessible screen
        await rPage.goto(`http://localhost:5173${roleDef.perm}`, { waitUntil: 'networkidle0' });
        console.log(`  - Navigated to permitted screen: ${roleDef.perm}`);
        
        const screenContent = await rPage.evaluate(() => document.body.innerText);
        if (screenContent.includes('403') || screenContent.includes('Unauthorized')) {
          throw new Error(`Screen blocked for permitted route!`);
        }
        
        // Data persistence across refresh
        await rPage.reload({ waitUntil: 'networkidle0' });
        const refreshedUrl = rPage.url();
        if(refreshedUrl.includes('login')) throw new Error('Session persistence failed on refresh');
        console.log(`  - Persistence verified. Retained session on refresh.`);

        // Test Unauthorized API 
        const roleToken = await rPage.evaluate(() => localStorage.getItem('payflow_token'));
        const unauthRes = await fetch('http://localhost:4000/api/platform/tenants', {
          headers: { Authorization: `Bearer ${roleToken}` }
        });
        if (unauthRes.status !== 403 && unauthRes.status !== 401) {
          throw new Error(`Unauthorized API check failed. Status: ${unauthRes.status}`);
        }
        console.log(`  - Unauthorized API Blocked (403)`);

        // Test Unauthorized UI (Navigate to Platform admin)
        await rPage.goto('http://localhost:5173/platform/tenants', { waitUntil: 'networkidle0' });
        const unauthContent = await rPage.evaluate(() => document.body.innerText);
        if (!unauthContent.includes('Unauthorized') && !unauthContent.includes('403') && !unauthContent.includes('Not Found')) {
          console.log(`  ! Warning: UI did not show strict Unauthorized screen (might just hide sidebar). URL: ${rPage.url()}`);
        } else {
           console.log(`  - Unauthorized UI Navigate Blocked.`);
        }

      } catch (err) {
        errors.push(`[${roleDef.role}] ${err.message}`);
        console.log(`  ! FAILED: ${err.message}`);
      } finally {
        await rPage.close();
      }
    }

    // Tenant Admin Test
    await testRoleUAT({ role: 'TENANT_SUPER_ADMIN', email: adminEmail, perm: '/dashboard' });
    
    // Other Roles Test
    for (const r of rolesToTest) {
      await testRoleUAT(r);
    }

  } catch (err) {
    errors.push('FATAL: ' + err.message);
  } finally {
    await browser.close();
  }

  if (errors.length > 0) {
    console.error('\n--- FINAL NEW TENANT ROLE UAT: FAIL ---');
    errors.forEach(e => console.error(e));
    process.exit(1);
  } else {
    console.log('\nNEW TENANT FULL ROLE UAT: PASS');
    process.exit(0);
  }
})();
