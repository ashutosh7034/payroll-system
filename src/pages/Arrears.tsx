import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkPermission } from '../utils/permissions';
import { Plus, Search, CheckCircle } from 'lucide-react';

export default function Arrears() {
  const { user } = useAuth();
  const [arrears, setArrears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArrears();
  }, []);

  const fetchArrears = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/arrears`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setArrears(data.data);
      }
    } catch (err) {
      console.error('Error fetching arrears', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Arrears Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage backdated salary revisions and arrears</p>
        </div>
        {checkPermission(user?.roles || [], 'MANAGE_PAYROLL') && (
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Process Arrear
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search arrears..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Loading arrears...</td></tr>
              ) : arrears.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No arrears found.</td></tr>
              ) : arrears.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.employee?.firstName} {a.employee?.lastName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{Number(a.totalAmount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{a.arrearType}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(a.effectiveDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${a.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {a.status}
                    </span>
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
