import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import EmployeesList from './pages/EmployeesList';

import ExceptionDashboard from './pages/ExceptionDashboard';
import PayrollResult from './pages/PayrollResult';
import ExplainPay from './pages/ExplainPay';
import SalaryStructureBuilder from './pages/SalaryStructureBuilder';
import PayrollInputCenter from './pages/PayrollInputCenter';
import PayrollControlTower from './pages/PayrollControlTower';
import TimeAttendanceDashboard from './pages/TimeAttendanceDashboard';
import Attendance from './pages/Attendance';
import Payslips from './pages/Payslips';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Organization from './pages/Organization';
import Leave from './pages/Leave';
import PlatformDashboard from './pages/PlatformDashboard';
import PlatformTenants from './pages/PlatformTenants';
import TenantManagement from './pages/TenantManagement';
import ConfigurationStudio from './pages/ConfigurationStudio';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import Simulation from './pages/Simulation';
import PlatformTenantConfiguration from './pages/PlatformTenantConfiguration';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Platform Admin Only */}
              <Route element={<RoleGuard allowedRoles={['PLATFORM_SUPER_ADMIN']} />}>
                <Route path="platform/dashboard" element={<PlatformDashboard />} />
                <Route path="platform/tenants" element={<PlatformTenants />} />
                <Route path="platform/tenants/:tenantId" element={<TenantManagement />} />
                <Route path="platform/tenants/:tenantId/configuration/:module" element={<PlatformTenantConfiguration />} />
              </Route>

              {/* Accessible by everyone including Employee */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="leave" element={<Leave />} />
              <Route path="payslips" element={<Payslips />} />
              <Route path="payslips/:id" element={<Payslips />} />
              
              {/* Not for regular employees */}
              <Route element={<RoleGuard forbidEmployeeOnly={true} />}>
                {/* Organization Module */}
                <Route element={<RoleGuard requiredPermission="organization.view" />}>
                  <Route path="organization" element={<Organization />} />
                </Route>
                <Route element={<RoleGuard requiredPermission="employee.view" />}>
                  <Route path="employees" element={<EmployeesList />} />
                </Route>

                {/* Compensation Module */}
                <Route element={<RoleGuard requiredPermission="compensation.view" />}>
                  <Route path="compensation/structure" element={<SalaryStructureBuilder />} />
                </Route>

                {/* Payroll Inputs Module (Assuming employee.manage or payroll.view context) */}
                <Route element={<RoleGuard requiredPermission="payroll.view" />}>
                  <Route path="payroll-inputs" element={<PayrollInputCenter />} />
                </Route>

                {/* Time & Attendance */}
                <Route element={<RoleGuard requiredPermission="attendance.view" />}>
                  <Route path="time-attendance" element={<TimeAttendanceDashboard />} />
                </Route>

                {/* Administration */}
                <Route element={<RoleGuard requiredPermission="settings.manage" />}>
                  <Route path="configuration" element={<ConfigurationStudio />} />
                  <Route path="ai-simulation" element={<Simulation />} />
                </Route>
                {/* Core Payroll */}
                <Route element={<RoleGuard requiredPermission="payroll.run" />}>
                  <Route path="payroll/run" element={<PayrollControlTower />} />
                  <Route path="payroll/exceptions" element={<ExceptionDashboard />} />
                  <Route path="payroll/result" element={<PayrollResult />} />
                  <Route path="payroll/explain" element={<ExplainPay />} />
                </Route>

                {/* Reports */}
                <Route element={<RoleGuard requiredPermission="reports.view" />}>
                  <Route path="reports" element={<Reports />} />
                  <Route path="reports/:id" element={<ReportDetail />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
