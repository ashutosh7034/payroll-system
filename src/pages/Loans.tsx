import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkPermission } from '../utils/permissions';
import { Plus, Search, CheckCircle, XCircle } from 'lucide-react';

export default function Loans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/loans`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setLoans(data.data);
      }
    } catch (err) {
      console.error('Error fetching loans', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/loans/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) fetchLoans();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Loans & Advances</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee loans and recoveries</p>
        </div>
        {checkPermission(user?.roles || [], 'MANAGE_PAYROLL') && (
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New Loan
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search loans..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tenure</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">EMI</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Loading loans...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No loans found.</td></tr>
              ) : loans.map((loan: any) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{loan.employee.firstName} {loan.employee.lastName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{Number(loan.principalAmount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{loan.tenureMonths} mos</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{Number(loan.emiAmount).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${loan.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {loan.status === 'PENDING' && checkPermission(user?.roles || [], 'MANAGE_PAYROLL') && (
                      <div className="flex space-x-2">
                        <button onClick={() => handleApprove(loan.id)} className="text-green-600 hover:text-green-900" title="Approve">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
