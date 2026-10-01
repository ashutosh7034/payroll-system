import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Loader2 } from 'lucide-react';

const MyAttendance = () => {
  const { token, user } = useAuth();
  const [myRecords, setMyRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.employeeId) fetchMyAttendance();
    else setLoading(false);
  }, [user]);

  const fetchMyAttendance = async () => {
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + `/me/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyRecords(data.data || data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (status: string) => {
    if (!user?.employeeId) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + `/me/attendance`, {
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
        fetchMyAttendance();
      } else {
        alert('Failed to mark attendance');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user?.employeeId) {
    return <div className="p-8 text-center text-secondary">You do not have a linked employee record.</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title mb-1">My Attendance</h1>
          <p className="text-secondary">View your daily attendance and shifts</p>
        </div>
        <button className="btn btn-primary" onClick={() => markAttendance('PRESENT')}>
          <Clock size={16} /> Web Check-in
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift</th>
                <th>Status</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <Loader2 className="animate-spin text-secondary mx-auto" size={24} />
                  </td>
                </tr>
              ) : myRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-secondary py-8">No attendance records found</td>
                </tr>
              ) : (
                myRecords.map((rec, i) => (
                  <tr key={i}>
                    <td className="font-medium">{new Date(rec.date).toLocaleDateString()}</td>
                    <td>General Shift (09:00 - 18:00)</td>
                    <td>
                      <span className={`badge ${rec.status === 'PRESENT' ? 'badge-success' : rec.status === 'ABSENT' ? 'badge-danger' : 'badge-neutral'}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td>{rec.punchIn ? new Date(rec.punchIn).toLocaleTimeString() : '-'}</td>
                    <td>{rec.punchOut ? new Date(rec.punchOut).toLocaleTimeString() : '-'}</td>
                    <td>{rec.totalHours ? rec.totalHours.toFixed(1) : '-'}</td>
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
export default MyAttendance;
