import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Payslips = () => {
  const { token, user } = useAuth();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/payslips', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch payslips');
      }
      
      setPayslips(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPayslips();
    }
  }, [token]);

  const handleDownload = async (id: string) => {
    try {
      setDownloading(id);
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + `/payslips/${id}/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to download payslip');
      }
      
      // In a real application, you would create an invisible anchor and click it to download the PDF URL
      // For this implementation, we will simulate the file download prompt or open it in a new tab
      if (data.data?.url) {
        window.open(data.data.url, '_blank');
      } else {
        alert('Payslip generated successfully. PDF integration available in production environment.');
      }
    } catch (err: any) {
      alert('Error downloading payslip: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-secondary flex items-center gap-2">
          <RefreshCw className="animate-spin" size={18} />
          Loading payslips...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="card p-6" style={{ borderLeft: '4px solid var(--error-color)' }}>
          <div className="flex items-center gap-3 text-error mb-4">
            <AlertCircle size={24} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Error loading payslips</h2>
          </div>
          <p className="text-secondary text-sm mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchPayslips}>
            <RefreshCw size={16} className="mr-2" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="page-title mb-1">My Payslips</h1>
          <p className="text-secondary text-small">View and download your finalized salary payslips.</p>
        </div>
      </div>

      <div className="card">
        {payslips.length === 0 ? (
          <div className="p-12 text-center border-b border-light">
            <FileText size={48} className="mx-auto mb-4 text-tertiary" style={{ opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              No finalized payslips available
            </h3>
            <p className="text-secondary text-sm max-w-md mx-auto">
              You do not have any processed and finalized payslips available to view at this time.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Pay Period</th>
                  <th className="text-right">Gross Salary</th>
                  <th className="text-right">Deductions</th>
                  <th className="text-right">Net Pay</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((ps) => {
                  const period = ps.payrollRun ? `${monthNames[ps.payrollRun.runPeriodMonth - 1]} ${ps.payrollRun.runPeriodYear}` : 'Unknown';
                  return (
                    <tr key={ps.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{period}</td>
                      <td className="text-right">₹{Number(ps.grossPay).toLocaleString()}</td>
                      <td className="text-right">₹{Number(ps.totalDeductions).toLocaleString()}</td>
                      <td className="text-right" style={{ fontWeight: 600 }}>₹{Number(ps.netPay).toLocaleString()}</td>
                      <td>
                        <span className="status-badge status-success">FINALIZED</span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            className="btn btn-secondary py-1 text-xs"
                            onClick={() => navigate(`/payslips/${ps.id}`)}
                          >
                            View
                          </button>
                          <button 
                            className="btn btn-primary py-1 text-xs"
                            onClick={() => handleDownload(ps.id)}
                            disabled={downloading === ps.id}
                          >
                            {downloading === ps.id ? (
                              <><RefreshCw size={12} className="animate-spin mr-1 inline" /> PDF</>
                            ) : (
                              <><Download size={12} className="mr-1 inline" /> PDF</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payslips;
