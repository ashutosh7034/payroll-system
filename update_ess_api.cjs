const fs = require('fs');

// Update MyAttendance.tsx
let myAtt = fs.readFileSync('src/pages/MyAttendance.tsx', 'utf8');
myAtt = myAtt.replace(/\/attendance\/records\/\$\{user\?\.employeeId \|\| ""\}/g, '/me/attendance');
myAtt = myAtt.replace(/\/attendance\/records\/\$\{user\.employeeId\}/g, '/me/attendance');
fs.writeFileSync('src/pages/MyAttendance.tsx', myAtt);

// Update MyLeave.tsx
let myLeave = fs.readFileSync('src/pages/MyLeave.tsx', 'utf8');
myLeave = myLeave.replace(/\/leave\/balance\/\$\{user\?\.employeeId \|\| ""\}\/\$\{year\}/g, '/me/leave/balance/${year}');
myLeave = myLeave.replace(/\/leave\/requests\/\$\{user\?\.employeeId \|\| ""\}/g, '/me/leave');
myLeave = myLeave.replace(/\/leave\/request\/\$\{user\.employeeId\}/g, '/me/leave');
fs.writeFileSync('src/pages/MyLeave.tsx', myLeave);

// Update MyPayslips.tsx
let myPayslips = fs.readFileSync('src/pages/MyPayslips.tsx', 'utf8');
myPayslips = myPayslips.replace(/\/payslip\/employee\/\$\{user\?\.employeeId \|\| ""\}/g, '/me/payslips');
myPayslips = myPayslips.replace(/\/payslip\/\$\{id\}/g, '/me/payslips/${id}');
myPayslips = myPayslips.replace(/\/payslip\/download\/\$\{ps.id\}/g, '/me/payslips/${ps.id}/download');
fs.writeFileSync('src/pages/MyPayslips.tsx', myPayslips);

console.log('done');
