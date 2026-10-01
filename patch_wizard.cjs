const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeesList.tsx', 'utf8');

// Use a regex to match the broken character pattern without hardcoding the weird character
code = code.replace(/\{step > s\.num \? ['"][^'"]+['"] : s\.num\}/g, "{step > s.num ? '✓' : s.num}");

fs.writeFileSync('src/pages/EmployeesList.tsx', code);
console.log('Patched step checkmark');
