import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileBarChart, FileText, FileSpreadsheet, Users, ChevronRight, BarChart3 } from 'lucide-react';
import { checkPermission } from '../utils/permissions';
import { useAuth } from '../contexts/AuthContext';

/* ───────────────────────────────────────────────────────────
   Report catalogue — mirrors the backend isAuthorized() map
   exactly so that the frontend never shows a report the
   backend would 403.
   ─────────────────────────────────────────────────────────── */

interface ReportDef {
  id: string;
  name: string;
  description: string;
  category: string;
  /** Which roles may access — mirrors report.controller.ts isAuthorized */
  allowedRoles: string[];
}

const REPORT_CATALOGUE: ReportDef[] = [
  // ── Payroll ──
  { id: 'payroll-register',  name: 'Payroll Register',      description: 'Detailed employee earnings, deductions and net pay',       category: 'Payroll',                allowedRoles: ['TENANT_SUPER_ADMIN','COMPANY_ADMIN','PAYROLL','PAYROLL_MANAGER','AUDITOR'] },
  { id: 'salary-register',   name: 'Salary Register',       description: 'Component-wise salary distribution across the organization', category: 'Payroll',               allowedRoles: ['TENANT_SUPER_ADMIN','COMPANY_ADMIN','PAYROLL','PAYROLL_MANAGER','AUDITOR'] },
  { id: 'payslip-report',    name: 'Payslip Report',        description: 'Aggregated view of generated payslips for a given period',  category: 'Payroll',                allowedRoles: ['TENANT_SUPER_ADMIN','COMPANY_ADMIN','PAYROLL','PAYROLL_MANAGER','AUDITOR'] },
  // ── Statutory & Compliance ──
  { id: 'tax-report',        name: 'Tax / TDS Report',      description: 'Tax deducted at source for all eligible employees',         category: 'Statutory & Compliance', allowedRoles: ['TENANT_SUPER_ADMIN','COMPANY_ADMIN','COMPLIANCE','AUDITOR'] },
  { id: 'pf-report',         name: 'PF Contribution',       description: 'Provident fund employer & employee contributions',          category: 'Statutory & Compliance', allowedRoles: ['TENANT_SUPER_ADMIN','COMPANY_ADMIN','COMPLIANCE','AUDITOR'] },
  { id: 'esi-report',        name: 'ESI Register',          description: 'Employee State Insurance monthly register',                 category: 'Statutory & Compliance', allowedRoles: ['TENANT_SUPER_ADMIN','COMPANY_ADMIN','COMPLIANCE','AUDITOR'] },
  // ── Finance & Accounting ──
  { id: 'payroll-cost',      name: 'Payroll Cost Analysis',  description: 'Total cost to company by department and location',         category: 'Finance & Accounting',   allowedRoles: ['TENANT_SUPER_ADMIN','COMPANY_ADMIN','FINANCE','AUDITOR'] },
  { id: 'bank-transfer',     name: 'Bank Transfer Advice',   description: 'Formatted export for corporate banking portals',           category: 'Finance & Accounting',   allowedRoles: ['TENANT_SUPER_ADMIN','COMPANY_ADMIN','FINANCE','AUDITOR'] },
  { id: 'accounting-journal', name: 'Accounting Journal',    description: 'GL mapped payroll liabilities and expenses',                category: 'Finance & Accounting',   allowedRoles: ['TENANT_SUPER_ADMIN','COMPANY_ADMIN','FINANCE','AUDITOR'] },
  // ── Employee & HR ──
  { id: 'employee-directory', name: 'Employee Directory',    description: 'Active workforce and contact information',                  category: 'Employee & HR',          allowedRoles: ['TENANT_SUPER_ADMIN','COMPANY_ADMIN','HR','AUDITOR'] },
  { id: 'attendance-summary', name: 'Attendance Summary',    description: 'Monthly attendance, leave and LOP analysis',                category: 'Employee & HR',          allowedRoles: ['TENANT_SUPER_ADMIN','COMPANY_ADMIN','HR','AUDITOR'] },
  { id: 'headcount-variance', name: 'Headcount Variance',   description: 'Joiners, exiters and net headcount changes',                 category: 'Employee & HR',          allowedRoles: ['TENANT_SUPER_ADMIN','COMPANY_ADMIN','HR','AUDITOR'] },
];

const CATEGORIES = ['All', 'Payroll', 'Statutory & Compliance', 'Finance & Accounting', 'Employee & HR'];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Payroll':                <FileBarChart size={14} />,
  'Statutory & Compliance': <FileText size={14} />,
  'Finance & Accounting':   <FileSpreadsheet size={14} />,
  'Employee & HR':          <Users size={14} />,
};

const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roles = user?.roles || [];

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  /* ── filter catalogue by role ── */
  const permittedReports = useMemo(() => {
    const isPlatformAdmin = roles.includes('PLATFORM_SUPER_ADMIN');
    return REPORT_CATALOGUE.filter(r => {
      if (isPlatformAdmin) return true;
      return r.allowedRoles.some(ar => roles.includes(ar));
    });
  }, [roles]);

  /* ── filter by search + category ── */
  const visibleReports = useMemo(() => {
    return permittedReports.filter(r => {
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'All' || r.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [search, activeCategory, permittedReports]);

  /* ── derive visible categories (only tabs with at least 1 report) ── */
  const visibleCategories = useMemo(() => {
    const cats = new Set(permittedReports.map(r => r.category));
    return CATEGORIES.filter(c => c === 'All' || cats.has(c));
  }, [permittedReports]);

  /* ── category counts ── */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: permittedReports.length };
    permittedReports.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [permittedReports]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: '4px' }}>Reports</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Payroll, compliance, finance and workforce reporting.</p>
      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '20px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type="text"
          placeholder="Search reports…"
          className="form-input"
          style={{ paddingLeft: '36px', height: '40px' }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Category tabs ── */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-light)', marginBottom: '24px', overflowX: 'auto' }}>
        {visibleCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: activeCategory === cat ? 600 : 500,
              color: activeCategory === cat ? 'var(--primary-dark)' : 'var(--text-secondary)',
              borderBottom: activeCategory === cat ? '2px solid var(--primary-dark)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
            }}
          >
            {cat}{' '}
            <span style={{ fontSize: '12px', opacity: 0.7 }}>({categoryCounts[cat] || 0})</span>
          </button>
        ))}
      </div>

      {/* ── Report list ── */}
      {visibleReports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <BarChart3 size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No reports found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            {search ? `No reports matching "${search}".` : 'No reports available for the selected category.'}
          </p>
          {(search || activeCategory !== 'All') && (
            <button className="btn btn-secondary" onClick={() => { setSearch(''); setActiveCategory('All'); }}>Clear Filters</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: 'var(--border-light)', border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
          {visibleReports.map(report => (
            <div
              key={report.id}
              onClick={() => navigate(`/reports/${report.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                backgroundColor: 'var(--bg-surface)',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover, #f9fafb)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
            >
              {/* Left: info */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '3px' }}>
                  {report.name}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {report.description}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {CATEGORY_ICONS[report.category]}
                    {report.category}
                  </span>
                  <span>·</span>
                  <span>Available on demand</span>
                </div>
              </div>

              {/* Right: action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '16px' }}>
                <span className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 500 }}>
                  View Report
                </span>
                <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer summary ── */}
      <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        Showing {visibleReports.length} of {permittedReports.length} available reports
      </div>
    </div>
  );
};

export default Reports;
