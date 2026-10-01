const fs = require('fs');
async function test() {
  try {
    const fetch = (await import('node-fetch')).default;
    const loginRes = await fetch('http://localhost:4000/api/auth/login', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ email: 'hr@demo.local', password: 'password' }) 
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    const adminDashRes = await fetch('http://localhost:4000/api/dashboard', { headers: { 'Authorization': `Bearer ${token}` } });
    const adminDash = await adminDashRes.json();
    console.log('Admin Dashboard Type:', adminDash.type);
    
    const essDashRes = await fetch('http://localhost:4000/api/dashboard?isEmployeeOnly=true', { headers: { 'Authorization': `Bearer ${token}` } });
    const essDash = await essDashRes.json();
    console.log('ESS Dashboard Type:', essDash.type);
    
  } catch(e) { console.error(e); }
}
test();
