const API = 'http://localhost:4000';

async function runUAT() {
  const report = {
    total: 0, passed: 0, failed: 0,
    results: []
  };

  const assert = (condition, name, module) => {
    report.total++;
    if (condition) {
      report.passed++;
      report.results.push({ name, module, status: 'PASS' });
      console.log(`[PASS] ${name}`);
    } else {
      report.failed++;
      report.results.push({ name, module, status: 'FAIL' });
      console.log(`[FAIL] ${name}`);
    }
  };

  try {
    // 1. Auth & Login
    const loginRes = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@demo.local',
        password: 'Payflow@Company2026!'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData?.data?.token;
    assert(!!token, 'Login SuperAdmin', 'Auth');

    // Check Loans
    try {
      const loanRes = await fetch(`${API}/api/loans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert(loanRes.status === 200, 'Fetch Loans API', 'Loans');
    } catch(e) { assert(false, 'Fetch Loans API', 'Loans'); }

    // Check Reimbursements
    try {
      const reimbRes = await fetch(`${API}/api/reimbursements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert(reimbRes.status === 200, 'Fetch Reimbursements API', 'Reimbursements');
    } catch(e) { assert(false, 'Fetch Reimbursements API', 'Reimbursements'); }

    // Check Arrears
    try {
      const arrRes = await fetch(`${API}/api/arrears`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert(arrRes.status === 200, 'Fetch Arrears API', 'Arrears');
    } catch(e) { assert(false, 'Fetch Arrears API', 'Arrears'); }

    // Test Employee Auth
    try {
      const empLogin = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'employee@demo.local',
          password: 'Payflow@Employee2026!'
        })
      });
      const empData = await empLogin.json();
      const empToken = empData?.data?.token;
      assert(!!empToken, 'Login Employee', 'Auth');

      // Employee tries to fetch all loans (should fail or return own)
      try {
        const empLoans = await fetch(`${API}/api/loans`, {
          headers: { Authorization: `Bearer ${empToken}` }
        });
        assert(empLoans.status === 403, 'Employee denied access to all loans', 'Security');
      } catch (e) {
        assert(false, 'Employee denied access to all loans', 'Security');
      }
    } catch(e) { assert(false, 'Employee flow', 'Security'); }
    
  } catch(e) {
    console.error(e);
  }

  console.log(`\nUAT Execution Complete: ${report.passed}/${report.total} Passed`);
}

runUAT();
