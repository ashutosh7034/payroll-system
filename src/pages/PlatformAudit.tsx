import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const PlatformAudit = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('payflow_token');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.action && { action: filters.action }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const res = await fetch(`http://localhost:4000/api/platform/audit?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPagination(p => ({ ...p, page: 1 }));
  };

  return (
    <div className="app-content-inner flex flex-col gap-6" style={{ paddingBottom: '40px' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title m-0">Platform Audit Logs</h1>
          <p className="text-secondary mt-1">Global audit trail across all companies and platform operations.</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-light">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-secondary" />
            <span className="font-medium text-sm">Filters</span>
          </div>
          
          <select 
            name="action" 
            className="form-input text-sm w-48"
            value={filters.action}
            onChange={handleFilterChange}
          >
            <option value="">All Actions</option>
            <option value="LOGIN">Login</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="SUPER_ADMIN_RESET">Super Admin Reset</option>
            <option value="UPDATE_STATUS">Status Change</option>
            <option value="UPDATE_ROLES">Role Change</option>
            <option value="UPDATE_MODULES">Module Change</option>
          </select>

          <input 
            type="date" 
            name="startDate" 
            className="form-input text-sm"
            value={filters.startDate}
            onChange={handleFilterChange}
            placeholder="Start Date"
          />

          <input 
            type="date" 
            name="endDate" 
            className="form-input text-sm"
            value={filters.endDate}
            onChange={handleFilterChange}
            placeholder="End Date"
          />
        </div>

        {loading && logs.length === 0 ? (
          <div className="text-center py-12 text-secondary">Loading audit logs...</div>
        ) : (
          <div className="table-responsive">
            <table className="table w-full text-sm">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Company</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-secondary">No audit logs found matching criteria.</td>
                  </tr>
                ) : logs.map(log => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap text-secondary">
                      {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td>
                      <div className="font-medium text-primary">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                      </div>
                      <div className="text-xs text-secondary">{log.user?.email}</div>
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {log.tenant.name.replace('PAYFLOW_PLATFORM', 'PLATFORM')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${log.action.includes('DELETE') || log.action.includes('RESET') ? 'bg-error' : 'bg-info'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="font-medium">{log.entity} <span className="text-xs text-secondary">({log.entityId?.substring(0,8)}...)</span></td>
                    <td>
                      {log.details ? (
                        <div className="text-xs font-mono bg-gray-50 p-2 rounded max-h-16 overflow-y-auto whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-light">
            <div className="text-sm text-secondary">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total records)
            </div>
            <div className="flex gap-2">
              <button 
                className="btn btn-secondary px-2 py-1 flex items-center"
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button 
                className="btn btn-secondary px-2 py-1 flex items-center"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformAudit;
