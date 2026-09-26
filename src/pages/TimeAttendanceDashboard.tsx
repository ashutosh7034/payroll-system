import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Calendar, Briefcase, FileText, CheckCircle, XCircle } from 'lucide-react';

const TimeAttendanceDashboard: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    // Simulated fetching for the active tab context.
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab, token]);

  const tabs = [
    { id: 'attendance', label: 'Attendance & LOP' },
    { id: 'leave', label: 'Leave & Approvals' },
    { id: 'calendar', label: 'Work Calendars' },
    { id: 'holidays', label: 'Holidays' },
    { id: 'timesheet', label: 'Timesheets' }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title mb-1">Time & Attendance</h1>
          <p className="text-secondary text-small">Manage shifts, daily attendance, leave approvals, and payroll-impacting LOP metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card stat-card" style={{ padding: '16px' }}>
          <div className="text-small text-secondary mb-1">Total Employees</div>
          <div className="text-xl font-bold">124</div>
        </div>
        <div className="card stat-card" style={{ padding: '16px' }}>
          <div className="text-small text-secondary mb-1">On Leave Today</div>
          <div className="text-xl font-bold">5</div>
        </div>
        <div className="card stat-card" style={{ padding: '16px' }}>
          <div className="text-small text-secondary mb-1">Pending Leave Approvals</div>
          <div className="text-xl font-bold text-warning">12</div>
        </div>
        <div className="card stat-card" style={{ padding: '16px' }}>
          <div className="text-small text-secondary mb-1">Total LOP (MTD)</div>
          <div className="text-xl font-bold text-danger">8.5 Days</div>
        </div>
      </div>

      <div className="tabs mb-6">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center p-8">Loading...</div>
        ) : (
          <div className="p-8 text-center text-secondary">
            <Clock size={32} className="mx-auto mb-3 opacity-50" />
            <h3 className="font-medium text-dark mb-1">No data available</h3>
            <p className="text-small">This is a structural module for Phase C operations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeAttendanceDashboard;
