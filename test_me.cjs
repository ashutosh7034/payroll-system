async function test() {
  try {
    const res = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hr@demo.local', password: 'admin123' })
    });
    const data = await res.json();
    console.log("Login user details:", data.user);
    if (data.token) {
        const meRes = await fetch('http://localhost:4000/api/me', {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        console.log("/api/me response:", await meRes.json());
    }
  } catch (e) { console.error(e); }
}
test();
