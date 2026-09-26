import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import EmployeesList from './pages/EmployeesList';
import PayrollRun from './pages/PayrollRun';
import ExceptionDashboard from './pages/ExceptionDashboard';
import PayrollResult from './pages/PayrollResult';
import ExplainPay from './pages/ExplainPay';
import SalaryStructureBuilder from './pages/SalaryStructureBuilder';
import PayrollInputCenter from './pages/PayrollInputCenter';
import PayrollControlTower from './pages/PayrollControlTower';
import TimeAttendanceDashboard from './pages/TimeAttendanceDashboard';
import Attendance from './pages/Attendance';
import Login from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="employees" element={<EmployeesList />} />
              <Route path="compensation/structure" element={<SalaryStructureBuilder />} />
              <Route path="payroll-inputs" element={<PayrollInputCenter />} />
              <Route path="time-attendance" element={<TimeAttendanceDashboard />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="payroll/run" element={<PayrollControlTower />} />
              <Route path="payroll/exceptions" element={<ExceptionDashboard />} />
              <Route path="payroll/result" element={<PayrollResult />} />
              <Route path="payroll/explain" element={<ExplainPay />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
