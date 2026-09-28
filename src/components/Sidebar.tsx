import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CalendarClock, 
  CalendarOff,
  Banknote,
  Calculator,
  FileBarChart,
  Settings,
  ShieldCheck,
  BrainCircuit,
  FileText,
  Receipt,
  User as UserIcon
} from 'lucide-react';

import { checkPermission } from '../utils/permissions';

const Sidebar = () => {
  const { user } = useAuth();
  
  const roles = user?.roles || [];
  const isPlatformAdmin = roles.includes('PLATFORM_SUPER_ADMIN');
  const isAdmin = roles.some(r => ['TENANT_SUPER_ADMIN', 'COMPANY_SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'PAYROLL', 'PAYROLL_MANAGER', 'FINANCE', 'COMPLIANCE', 'MANAGER', 'AUDITOR'].includes(r));
  const isEmployeeOnly = !isPlatformAdmin && !isAdmin && roles.includes('EMPLOYEE');

  // Permission Checks
  const canViewOrg = checkPermission(roles, 'organization.view');
  const canViewEmployees = checkPermission(roles, 'employee.view');
  const hasOrganizationGroup = canViewOrg || canViewEmployees;

  const canViewAttendance = checkPermission(roles, 'attendance.view');
  const canViewLeave = checkPermission(roles, 'leave.view');
  const hasTimeLeaveGroup = canViewAttendance || canViewLeave;

  const canViewCompensation = checkPermission(roles, 'compensation.view');
  const hasCompensationGroup = canViewCompensation;

  const canRunPayroll = checkPermission(roles, 'payroll.run');
  const hasPayrollGroup = canRunPayroll;

  const canViewReports = checkPermission(roles, 'reports.view');
  const hasReportsGroup = canViewReports;

  const canManageSettings = checkPermission(roles, 'settings.manage');
  const hasAdminGroup = canManageSettings;

  return (
    <aside className="app-sidebar flex flex-col h-full">
      <div className="flex items-center gap-2" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--primary-dark)', borderRadius: '4px' }}></div>
        <span className="card-title" style={{ letterSpacing: '1px' }}>PAYFLOW</span>
      </div>
      
      {isPlatformAdmin && (
        <div style={{ padding: '16px 0', flex: 1, overflowY: 'auto' }}>
          <div className="nav-group-title">Platform Administration</div>
          <NavLink to="/platform/dashboard" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <LayoutDashboard size={18} /> Platform Overview
          </NavLink>
          <NavLink to="/platform/tenants" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Building2 size={18} /> Companies
          </NavLink>
        </div>
      )}
      
      {isAdmin && (
        <div style={{ padding: '16px 0', flex: 1, overflowY: 'auto' }}>
          <div className="nav-group-title">Overview</div>
          <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          
          {hasOrganizationGroup && (
            <>
              <div className="nav-group-title">Organization</div>
              {canViewOrg && (
                <NavLink to="/organization" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                  <Building2 size={18} /> Structure
                </NavLink>
              )}
              {canViewEmployees && (
                <NavLink to="/employees" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                  <Users size={18} /> Employees
                </NavLink>
              )}
            </>
          )}
          
          {hasTimeLeaveGroup && (
            <>
              <div className="nav-group-title">Time & Leave</div>
              {canViewAttendance && (
                <NavLink to="/attendance" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                  <CalendarClock size={18} /> Attendance
                </NavLink>
              )}
              {canViewLeave && (
                <NavLink to="/leave" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                  <CalendarOff size={18} /> Leave
                </NavLink>
              )}
            </>
          )}

          {hasCompensationGroup && (
            <>
              <div className="nav-group-title">Compensation</div>
              {canViewCompensation && (
                <NavLink to="/compensation/structure" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                  <Banknote size={18} /> Salary Structures
                </NavLink>
              )}
            </>
          )}

          {hasPayrollGroup && (
            <>
              <div className="nav-group-title">Payroll</div>
              {canRunPayroll && (
                <>
                  <NavLink to="/payroll/run" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Calculator size={18} /> Process Payroll
                  </NavLink>
                  <NavLink to="/payroll/exceptions" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                    <ShieldCheck size={18} /> Exceptions
                  </NavLink>
                </>
              )}
            </>
          )}
          
          {hasReportsGroup && (
            <>
              <div className="nav-group-title">Finance & Reports</div>
              {canViewReports && (
                <NavLink to="/reports" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                  <FileBarChart size={18} /> Reports
                </NavLink>
              )}
            </>
          )}
          
          {hasAdminGroup && (
            <>
              <div className="nav-group-title">Administration</div>
              {canManageSettings && (
                <>
                  <NavLink to="/configuration" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Settings size={18} /> Configuration
                  </NavLink>
                  <NavLink to="/ai-simulation" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                    <BrainCircuit size={18} /> Simulation
                  </NavLink>
                </>
              )}
            </>
          )}
        </div>
      )}

      {isEmployeeOnly && (
        <div style={{ padding: '16px 0', flex: 1, overflowY: 'auto' }}>
          <div className="nav-group-title">Overview</div>
          <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <LayoutDashboard size={18} /> My Dashboard
          </NavLink>
          
          <div className="nav-group-title">My Work</div>
          <NavLink to="/attendance" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <CalendarClock size={18} /> My Attendance
          </NavLink>
          <NavLink to="/leave" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <CalendarOff size={18} /> My Leave
          </NavLink>

          <div className="nav-group-title">My Payroll</div>
          <NavLink to="/payslips" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <FileText size={18} /> My Payslips
          </NavLink>
          {/*
          <NavLink to="/salary" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Banknote size={18} /> My Salary
          </NavLink>
          <NavLink to="/tax" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Receipt size={18} /> Tax & Declarations
          </NavLink>

          <div className="nav-group-title">My Requests</div>
          <NavLink to="/reimbursements" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Banknote size={18} /> Reimbursements
          </NavLink>
          */}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
