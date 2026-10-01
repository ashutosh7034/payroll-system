const fs = require('fs');

const appPath = 'src/App.tsx';
let appContent = fs.readFileSync(appPath, 'utf8');

if (!appContent.includes('import Loans from')) {
  appContent = appContent.replace(
    "import Organization from './pages/Organization';",
    "import Organization from './pages/Organization';\nimport Loans from './pages/Loans';\nimport Reimbursements from './pages/Reimbursements';\nimport Arrears from './pages/Arrears';"
  );
  appContent = appContent.replace(
    "<Route path=\"/organization\" element={<Organization />} />",
    "<Route path=\"/organization\" element={<Organization />} />\n              <Route path=\"/loans\" element={<Loans />} />\n              <Route path=\"/reimbursements\" element={<Reimbursements />} />\n              <Route path=\"/arrears\" element={<Arrears />} />"
  );
  fs.writeFileSync(appPath, appContent);
  console.log('App.tsx updated');
}

const sidebarPath = 'src/components/Sidebar.tsx';
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

if (!sidebarContent.includes('{ icon: Coins, label: \'Loans\', path: \'/loans\', permission: \'VIEW_PAYROLL\' }')) {
  sidebarContent = sidebarContent.replace(
    "{ icon: Calculator, label: 'Payroll', path: '/payroll', permission: 'VIEW_PAYROLL' },",
    "{ icon: Calculator, label: 'Payroll', path: '/payroll', permission: 'VIEW_PAYROLL' },\n    { icon: Coins, label: 'Loans', path: '/loans', permission: 'VIEW_PAYROLL' },\n    { icon: Receipt, label: 'Reimbursements', path: '/reimbursements', permission: 'VIEW_PAYROLL' },\n    { icon: FileSpreadsheet, label: 'Arrears', path: '/arrears', permission: 'VIEW_PAYROLL' },"
  );
  
  // also make sure imports for Coins, Receipt, FileSpreadsheet exist
  if (!sidebarContent.includes('Coins, Receipt, FileSpreadsheet')) {
    sidebarContent = sidebarContent.replace(
      "import { LayoutDashboard",
      "import { LayoutDashboard, Coins, Receipt, FileSpreadsheet"
    );
  }
  
  fs.writeFileSync(sidebarPath, sidebarContent);
  console.log('Sidebar.tsx updated');
}
