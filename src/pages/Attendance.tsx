import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CalendarClock, Loader2, Search, Filter } from 'lucide-react';

const Attendance = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (employeeId: string, status: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + `/attendance/records/${employeeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: today,
          status,
          punchIn: status === 'PRESENT' ? new Date().toISOString() : null
        })
      });
      if (res.ok) {
        alert('Attendance marked successfully!');
      } else {
        alert('Failed to mark attendance');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title mb-1">Time & Attendance</h1>
          <p className="text-secondary">Manage daily attendance and shifts</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="flex justify-between items-center" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex gap-3">
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type="text" placeholder="Search employee..." className="form-input" style={{ paddingLeft: '36px', height: '36px' }} />
            </div>
            <button className="btn btn-secondary" style={{ height: '36px', padding: '0 12px' }}>
              <Filter size={16} /> Filters
            </button>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Shift</th>
                <th>Today's Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8">
                    <Loader2 className="animate-spin text-secondary mx-auto" size={24} />
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-secondary py-8">No employees found</td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                      <div className="text-small text-secondary">{emp.employeeId}</div>
                    </td>
                    <td>General Shift (09:00 - 18:00)</td>
                    <td>
                      <span className="badge badge-neutral">PENDING</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => markAttendance(emp.id, 'PRESENT')}>Mark Present</button>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => markAttendance(emp.id, 'ABSENT')}>Mark Absent</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
