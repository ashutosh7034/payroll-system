const fs = require('fs');

let att = fs.readFileSync('src/pages/Attendance.tsx', 'utf8');
att = att.replace('`${user.employeeId}`', '`${user?.employeeId || ""}`');
att = att.replace('`${user?.employeeId}`', '`${user?.employeeId || ""}`');
att = att.replace('user.employeeId,', 'user?.employeeId || "",');
att = att.replace('if (isEmployeeOnly && user?.employeeId)', 'if (isEmployeeOnly && user && user.employeeId)');
fs.writeFileSync('src/pages/Attendance.tsx', att);

let leave = fs.readFileSync('src/pages/Leave.tsx', 'utf8');
leave = leave.replace('`${user.employeeId}`', '`${user?.employeeId || ""}`');
leave = leave.replace('`${user?.employeeId}`', '`${user?.employeeId || ""}`');
leave = leave.replace('`${user.employeeId}`', '`${user?.employeeId || ""}`');
leave = leave.replace('`${user?.employeeId}`', '`${user?.employeeId || ""}`');
leave = leave.replace('`${user.employeeId}`', '`${user?.employeeId || ""}`');
leave = leave.replace('`${user?.employeeId}`', '`${user?.employeeId || ""}`');
leave = leave.replace('if (isEmployeeOnly && user?.employeeId)', 'if (isEmployeeOnly && user && user.employeeId)');
fs.writeFileSync('src/pages/Leave.tsx', leave);

console.log('done');
