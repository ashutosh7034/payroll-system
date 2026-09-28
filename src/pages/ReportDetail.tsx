import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RotateCcw, Download, FileDown, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/* ───────────────────────────────────────────────────────
   Report metadata — titles, descriptions, column defs
   ─────────────────────────────────────────────────────── */

interface ColumnDef {
  key: string;
  label: string;
  align?: 'left' | 'right';
  format?: 'currency' | 'badge' | 'mono';
}

interface ReportMeta {
  title: string;
  description: string;
  columns: ColumnDef[];
  /** Which fields to extract from raw API row */
  rowMapper: (row: any) => Record<string, any>;
  /** Whether period filter is relevant */
  hasPeriodFilter: boolean;
}

const fmt = (n: number) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const REPORTS: Record<string, ReportMeta> = {
  'payroll-register': {
    title: 'Payroll Register',
    description: 'Detailed employee payroll earnings, deductions and net pay.',
    hasPeriodFilter: true,
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Employee' },
      { key: 'department', label: 'Department' },
      { key: 'gross', label: 'Gross Pay', align: 'right', format: 'currency' },
      { key: 'deductions', label: 'Deductions', align: 'right', format: 'currency' },
      { key: 'net', label: 'Net Pay', align: 'right', format: 'currency' },
      { key: 'status', label: 'Status', format: 'badge' },
    ],
    rowMapper: (r) => ({
      employeeId: r.employee?.employeeId || '',
      name: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
      department: r.employee?.department?.name || '—',
      gross: Number(r.grossPay || 0),
      deductions: Number(r.totalDeductions || 0),
      net: Number(r.netPay || 0),
      status: r.payrollRun?.status || 'N/A',
    }),
  },
  'salary-register': {
    title: 'Salary Register',
    description: 'Component-wise salary distribution across the organization.',
    hasPeriodFilter: false,
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Employee' },
      { key: 'department', label: 'Department' },
      { key: 'status', label: 'Status', format: 'badge' },
    ],
    rowMapper: (r) => ({
      employeeId: r.employeeId || '',
      name: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      department: r.department?.name || '—',
      status: r.status || 'ACTIVE',
    }),
  },
  'payslip-report': {
    title: 'Payslip Report',
    description: 'Aggregated view of generated payslips for a given period.',
    hasPeriodFilter: true,
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Employee' },
      { key: 'department', label: 'Department' },
      { key: 'gross', label: 'Gross Pay', align: 'right', format: 'currency' },
      { key: 'deductions', label: 'Deductions', align: 'right', format: 'currency' },
      { key: 'net', label: 'Net Pay', align: 'right', format: 'currency' },
      { key: 'status', label: 'Status', format: 'badge' },
    ],
    rowMapper: (r) => ({
      employeeId: r.employee?.employeeId || '',
      name: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
      department: r.employee?.department?.name || '—',
      gross: Number(r.grossPay || 0),
      deductions: Number(r.totalDeductions || 0),
      net: Number(r.netPay || 0),
      status: r.payrollRun?.status || 'N/A',
    }),
  },
  'tax-report': {
    title: 'Tax / TDS Report',
    description: 'Tax deducted at source for all eligible employees.',
    hasPeriodFilter: true,
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Employee' },
      { key: 'department', label: 'Department' },
      { key: 'gross', label: 'Gross Pay', align: 'right', format: 'currency' },
      { key: 'deductions', label: 'TDS', align: 'right', format: 'currency' },
    ],
    rowMapper: (r) => ({
      employeeId: r.employee?.employeeId || '',
      name: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
      department: r.employee?.department?.name || '—',
      gross: Number(r.grossPay || 0),
      deductions: Number(r.totalDeductions || 0),
    }),
  },
  'pf-report': {
    title: 'PF Contribution',
    description: 'Provident fund employer & employee contributions.',
    hasPeriodFilter: true,
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Employee' },
      { key: 'department', label: 'Department' },
      { key: 'gross', label: 'PF Wage', align: 'right', format: 'currency' },
      { key: 'deductions', label: 'PF Deducted', align: 'right', format: 'currency' },
    ],
    rowMapper: (r) => ({
      employeeId: r.employee?.employeeId || '',
      name: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
      department: r.employee?.department?.name || '—',
      gross: Number(r.grossPay || 0),
      deductions: Number(r.totalDeductions || 0),
    }),
  },
  'esi-report': {
    title: 'ESI Register',
    description: 'Employee State Insurance monthly register.',
    hasPeriodFilter: true,
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Employee' },
      { key: 'department', label: 'Department' },
      { key: 'gross', label: 'ESI Wage', align: 'right', format: 'currency' },
      { key: 'deductions', label: 'ESI Deducted', align: 'right', format: 'currency' },
    ],
    rowMapper: (r) => ({
      employeeId: r.employee?.employeeId || '',
      name: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
      department: r.employee?.department?.name || '—',
      gross: Number(r.grossPay || 0),
      deductions: Number(r.totalDeductions || 0),
    }),
  },
  'payroll-cost': {
    title: 'Payroll Cost Analysis',
    description: 'Total cost to company by department and location.',
    hasPeriodFilter: true,
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Employee' },
      { key: 'department', label: 'Department' },
      { key: 'gross', label: 'Gross Pay', align: 'right', format: 'currency' },
      { key: 'deductions', label: 'Deductions', align: 'right', format: 'currency' },
      { key: 'net', label: 'Net Pay', align: 'right', format: 'currency' },
    ],
    rowMapper: (r) => ({
      employeeId: r.employee?.employeeId || '',
      name: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
      department: r.employee?.department?.name || '—',
      gross: Number(r.grossPay || 0),
      deductions: Number(r.totalDeductions || 0),
      net: Number(r.netPay || 0),
    }),
  },
  'bank-transfer': {
    title: 'Bank Transfer Advice',
    description: 'Formatted export for corporate banking portals.',
    hasPeriodFilter: false,
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Employee' },
      { key: 'bank', label: 'Bank' },
      { key: 'account', label: 'Account', format: 'mono' },
      { key: 'ifsc', label: 'IFSC', format: 'mono' },
      { key: 'amount', label: 'Amount', align: 'right', format: 'currency' },
      { key: 'status', label: 'Status', format: 'badge' },
    ],
    rowMapper: (r) => ({
      employeeId: r.employee?.employeeId || '',
      name: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
      bank: r.bankName || '—',
      account: r.accountNumber ? `XXXX${r.accountNumber.slice(-4)}` : '—',
      ifsc: r.ifscCode || '—',
      amount: Number(r.amount || 0),
      status: r.status || 'N/A',
    }),
  },
  'accounting-journal': {
    title: 'Accounting Journal',
    description: 'GL mapped payroll liabilities and expenses.',
    hasPeriodFilter: false,
    columns: [
      { key: 'id', label: 'Journal ID' },
      { key: 'status', label: 'Status', format: 'badge' },
    ],
    rowMapper: (r) => ({
      id: r.id || '',
      status: r.status || 'N/A',
    }),
  },
  'employee-directory': {
    title: 'Employee Directory',
    description: 'Active workforce and contact information.',
    hasPeriodFilter: false,
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Employee' },
      { key: 'email', label: 'Email' },
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'status', label: 'Status', format: 'badge' },
    ],
    rowMapper: (r) => ({
      employeeId: r.employeeId || '',
      name: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      email: r.email || '—',
      department: r.department?.name || '—',
      designation: r.designation?.name || '—',
      status: r.status || 'ACTIVE',
    }),
  },
  'attendance-summary': {
    title: 'Attendance Summary',
    description: 'Monthly attendance, leave and LOP analysis.',
    hasPeriodFilter: true,
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Employee' },
      { key: 'department', label: 'Department' },
      { key: 'status', label: 'Status', format: 'badge' },
    ],
    rowMapper: (r) => ({
      employeeId: r.employeeId || '',
      name: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      department: r.department?.name || '—',
      status: r.status || 'ACTIVE',
    }),
  },
  'headcount-variance': {
    title: 'Headcount Variance',
    description: 'Joiners, exiters and net headcount changes.',
    hasPeriodFilter: false,
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Employee' },
      { key: 'department', label: 'Department' },
      { key: 'status', label: 'Status', format: 'badge' },
    ],
    rowMapper: (r) => ({
      employeeId: r.employeeId || '',
      name: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      department: r.department?.name || '—',
      status: r.status || 'ACTIVE',
    }),
  },
};

/* ───────────────────────────────────────────────────────
   Page component
   ─────────────────────────────────────────────────────── */

const ReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const meta = id ? REPORTS[id] : null;

  // Filters
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [period, setPeriod] = useState(defaultPeriod);
  const [department, setDepartment] = useState('');

  // State machine: idle → loading → results | error
  const [state, setState] = useState<'idle' | 'loading' | 'results' | 'error'>('idle');
  const [rawData, setRawData] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Fetch departments for the filter
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/org/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setDepartments(json.data || json || []);
        }
      } catch { /* silent — dept filter will just not populate */ }
    })();
  }, [token]);

  /* ── Run report ── */
  const runReport = useCallback(async () => {
    if (!id || !meta) return;
    setState('loading');
    setErrorMsg('');
    setPage(1);
    try {
      const query = new URLSearchParams();
      if (meta.hasPeriodFilter && period) query.append('period', period);
      if (department) query.append('department', department);

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/reports/${id}?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) throw new Error("You don't have permission to view this report.");
      if (!res.ok) throw new Error('Failed to load report data.');
      const json = await res.json();
      setRawData(json);
      setState('results');
    } catch (err: any) {
      setErrorMsg(err.message);
      setState('error');
    }
  }, [id, meta, period, department, token]);

  /* ── Mapped rows ── */
  const mappedRows = meta ? rawData.map(meta.rowMapper) : [];
  const totalPages = Math.max(1, Math.ceil(mappedRows.length / perPage));
  const pagedRows = mappedRows.slice((page - 1) * perPage, page * perPage);

  /* ── Summary metrics ── */
  const summary = (() => {
    if (!meta || mappedRows.length === 0) return null;
    if (['payroll-register', 'payslip-report', 'payroll-cost'].includes(id || '')) {
      const gross = mappedRows.reduce((s, r) => s + (r.gross || 0), 0);
      const ded = mappedRows.reduce((s, r) => s + (r.deductions || 0), 0);
      const net = mappedRows.reduce((s, r) => s + (r.net || 0), 0);
      return [
        { label: 'Employees', value: String(mappedRows.length) },
        { label: 'Gross Payroll', value: fmt(gross) },
        { label: 'Total Deductions', value: fmt(ded) },
        ...(id !== 'payroll-cost' ? [{ label: 'Net Pay', value: fmt(net) }] : []),
      ];
    }
    if (['tax-report', 'pf-report', 'esi-report'].includes(id || '')) {
      const total = mappedRows.reduce((s, r) => s + (r.deductions || 0), 0);
      return [
        { label: 'Employees', value: String(mappedRows.length) },
        { label: 'Total Contribution', value: fmt(total) },
      ];
    }
    return [{ label: 'Records', value: String(mappedRows.length) }];
  })();

  /* ── Export helpers ── */
  const doExport = async (format: 'csv' | 'pdf') => {
    const query = new URLSearchParams();
    if (meta?.hasPeriodFilter && period) query.append('period', period);
    if (department) query.append('department', department);

    const endpoint = format === 'csv' ? 'export' : 'export-pdf';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/reports/${id}/${endpoint}?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Export ${format.toUpperCase()} failed.`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}_${period}.${format}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      alert(err.message);
    }
  };

  /* ── Reset ── */
  const resetFilters = () => {
    setPeriod(defaultPeriod);
    setDepartment('');
    setState('idle');
    setRawData([]);
  };

  if (!meta) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <FileText size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Report not found</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>The requested report does not exist.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/reports')}>Back to Reports</button>
      </div>
    );
  }

  /* ── Render cell ── */
  const renderCell = (col: ColumnDef, val: any) => {
    if (col.format === 'currency') return fmt(val);
    if (col.format === 'badge') return <span className={`badge ${val === 'FINALIZED' || val === 'ACTIVE' || val === 'COMPLETED' ? 'badge-success' : 'badge-neutral'}`}>{val}</span>;
    if (col.format === 'mono') return <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{val}</span>;
    return val;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>

      {/* ── Back link ── */}
      <button
        onClick={() => navigate('/reports')}
        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '20px', transition: 'color 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-dark)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <ArrowLeft size={16} /> Reports
      </button>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: '4px' }}>{meta.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>{meta.description}</p>
      </div>

      {/* ── Report Parameters ── */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Report Parameters
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          {meta.hasPeriodFilter && (
            <div style={{ minWidth: '180px' }}>
              <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Payroll Period</label>
              <input type="month" className="form-input" style={{ height: '38px' }} value={period} onChange={e => setPeriod(e.target.value)} />
            </div>
          )}
          <div style={{ minWidth: '200px' }}>
            <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Department</label>
            <select className="form-select" style={{ height: '38px' }} value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button className="btn btn-secondary" style={{ height: '38px', padding: '0 14px', fontSize: '13px' }} onClick={resetFilters}>
              <RotateCcw size={14} style={{ marginRight: '6px' }} /> Reset
            </button>
            <button className="btn btn-primary" style={{ height: '38px', padding: '0 16px', fontSize: '13px' }} onClick={runReport} disabled={state === 'loading'}>
              {state === 'loading' ? <Loader2 size={14} className="animate-spin" style={{ marginRight: '6px' }} /> : <Play size={14} style={{ marginRight: '6px' }} />}
              Run Report
            </button>
          </div>
        </div>
      </div>

      {/* ── State: idle ── */}
      {state === 'idle' && (
        <div style={{ textAlign: 'center', padding: '64px 24px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
          <Play size={36} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Configure and run this report</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Select your filters above, then click <strong>Run Report</strong> to generate the data.
          </p>
        </div>
      )}

      {/* ── State: loading ── */}
      {state === 'loading' && (
        <div style={{ textAlign: 'center', padding: '64px 24px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary-dark)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Generating report data…</p>
        </div>
      )}

      {/* ── State: error ── */}
      {state === 'error' && (
        <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: 'var(--error-bg, #fef2f2)', border: '1px solid var(--error-border, #fecaca)', borderRadius: '8px' }}>
          <AlertCircle size={28} style={{ color: 'var(--error-color, #dc2626)', marginBottom: '10px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--error-color, #dc2626)', marginBottom: '6px' }}>Unable to load {meta.title}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>{errorMsg}</p>
          <button className="btn btn-secondary" onClick={runReport}>Retry</button>
        </div>
      )}

      {/* ── State: results ── */}
      {state === 'results' && (
        <>
          {/* Summary */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${summary.length}, 1fr)`, gap: '16px', marginBottom: '20px' }}>
              {summary.map((s, i) => (
                <div key={i} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Export bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              {mappedRows.length} record{mappedRows.length !== 1 ? 's' : ''} found
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ height: '34px', padding: '0 12px', fontSize: '13px' }} onClick={() => doExport('csv')} disabled={mappedRows.length === 0}>
                <FileDown size={14} style={{ marginRight: '6px' }} /> CSV
              </button>
              <button className="btn btn-secondary" style={{ height: '34px', padding: '0 12px', fontSize: '13px' }} onClick={() => doExport('pdf')} disabled={mappedRows.length === 0}>
                <Download size={14} style={{ marginRight: '6px' }} /> PDF
              </button>
            </div>
          </div>

          {/* Table */}
          {mappedRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
              <FileText size={36} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>No records found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
                No data available for the selected filters.
              </p>
              <button className="btn btn-secondary" onClick={resetFilters}>Change Filters</button>
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface-active, #f3f4f6)', borderBottom: '1px solid var(--border-light)' }}>
                      {meta.columns.map(col => (
                        <th key={col.key} style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', textAlign: col.align || 'left', whiteSpace: 'nowrap' }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.1s' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover, #f9fafb)')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        {meta.columns.map(col => (
                          <td key={col.key} style={{ padding: '10px 16px', color: 'var(--text-primary)', textAlign: col.align || 'left', whiteSpace: 'nowrap' }}>
                            {renderCell(col, row[col.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid var(--border-light)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, mappedRows.length)} of {mappedRows.length}</span>
                  <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} style={{ border: '1px solid var(--border-light)', borderRadius: '4px', padding: '2px 4px', fontSize: '12px', background: 'var(--bg-surface)' }}>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 10px', border: '1px solid var(--border-light)', borderRadius: '4px', background: 'var(--bg-surface)', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.5 : 1, fontSize: '12px' }}>Previous</button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 10px', border: '1px solid var(--border-light)', borderRadius: '4px', background: 'var(--bg-surface)', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.5 : 1, fontSize: '12px' }}>Next</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportDetail;
