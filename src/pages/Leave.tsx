import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CalendarOff, Loader2 } from 'lucide-react';

const Leave = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/leave/policies', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to fetch leave policies');
        const data = await response.json();
        setPolicies(data.data || data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, [token]);

  return (
    <div>
      <h1 className="page-title mb-6">Leave Management</h1>
      {error && <div className="text-danger mb-4">Error: {error}</div>}
      
      <div className="card">
        <h2 className="card-title flex items-center gap-2 mb-4"><CalendarOff size={18}/> Leave Policies</h2>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-secondary" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Type</th>
                <th>Days Allowed</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p: any) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.name}</td>
                  <td>{p.type}</td>
                  <td>{p.daysAllowed}</td>
                </tr>
              ))}
              {policies.length === 0 && <tr><td colSpan={3} className="text-center text-secondary py-4">No leave policies found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
export default Leave;
