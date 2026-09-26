import React from 'react';
import { NavLink } from 'react-router-dom';
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
  BrainCircuit
} from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="app-sidebar">
      <div className="flex items-center gap-2" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--primary-dark)', borderRadius: '4px' }}></div>
        <span className="card-title" style={{ letterSpacing: '1px' }}>PAYFLOW</span>
      </div>
      
      <div style={{ padding: '16px 0', flex: 1, overflowY: 'auto' }}>
        <div className="nav-group-title">Overview</div>
        <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        
        <div className="nav-group-title">Organization</div>
        <NavLink to="/organization" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Building2 size={18} /> Structure
        </NavLink>
        <NavLink to="/employees" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Users size={18} /> Employees
        </NavLink>
        
        <div className="nav-group-title">Time & Leave</div>
        <NavLink to="/attendance" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <CalendarClock size={18} /> Attendance
        </NavLink>
        <NavLink to="/leave" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <CalendarOff size={18} /> Leave
        </NavLink>

        <div className="nav-group-title">Compensation</div>
        <NavLink to="/compensation/structure" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Banknote size={18} /> Salary Structures
        </NavLink>

        <div className="nav-group-title">Payroll</div>
        <NavLink to="/payroll/run" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Calculator size={18} /> Process Payroll
        </NavLink>
        <NavLink to="/payroll/exceptions" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <ShieldCheck size={18} /> Exceptions
        </NavLink>
        
        <div className="nav-group-title">Finance & Reports</div>
        <NavLink to="/reports" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <FileBarChart size={18} /> Reports
        </NavLink>
        
        <div className="nav-group-title">Administration</div>
        <NavLink to="/configuration" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Settings size={18} /> Configuration
        </NavLink>
        <NavLink to="/ai-simulation" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <BrainCircuit size={18} /> Simulation
        </NavLink>
      </div>
      
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)' }}>
        <div className="flex items-center gap-3">
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontWeight: 600, fontSize: '12px' }}>
            HR
          </div>
          <div className="flex-col">
            <span className="text-body" style={{ fontWeight: 500 }}>HR Manager</span>
            <span className="text-small">India Entity</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
