import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function Accounting() {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const res = await fetch('/api/accounting', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setJournals(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = (journal: any) => {
    if (!journal || !journal.lines) return;
    
    const headers = ['Account Name', 'Account Number', 'Debit', 'Credit', 'Source', 'Description'];
    const rows = journal.lines.map((l: any) => [
      `"${l.accountName}"`,
      `"${l.accountNumber}"`,
      l.debit.toFixed(2),
      l.credit.toFixed(2),
      `"${l.source || ''}"`,
      `"${l.description || ''}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map((e: any) => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `journal_${journal.reference}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounting Journal / GL</h1>
          <p className="text-sm text-gray-500">General Ledger mapping and payroll journal entries.</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Generated Journals</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payroll Period</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Debit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Credit</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {journals.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedJournal(j)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(j.date), 'MMM d, yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{j.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{j.payrollRun?.runPeriodMonth}/{j.payrollRun?.runPeriodYear}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">₹{Number(j.totalDebit).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">₹{Number(j.totalCredit).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${j.status === 'POSTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900" onClick={(e) => { e.stopPropagation(); setSelectedJournal(j); }}>View</button>
                  </td>
                </tr>
              ))}
              {journals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No accounting journals generated yet. Lock a payroll run to generate.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedJournal && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Journal Details: {selectedJournal.reference}</h2>
              <p className="text-sm text-gray-500">Date: {format(new Date(selectedJournal.date), 'MMM d, yyyy')}</p>
            </div>
            <div className="space-x-3">
              <button 
                onClick={() => handleExportCSV(selectedJournal)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Export CSV
              </button>
              <button 
                onClick={() => setSelectedJournal(null)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700">
                Close
              </button>
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acc Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit (₹)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedJournal.lines?.map((line: any) => (
                <tr key={line.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{line.accountName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{line.accountNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{line.source || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">{Number(line.debit) > 0 ? Number(line.debit).toFixed(2) : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">{Number(line.credit) > 0 ? Number(line.credit).toFixed(2) : '-'}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td colSpan={3} className="px-6 py-4 text-right text-sm text-gray-900">Totals</td>
                <td className="px-6 py-4 text-right text-sm text-green-600">₹{Number(selectedJournal.totalDebit).toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-sm text-blue-600">₹{Number(selectedJournal.totalCredit).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          {Math.abs(Number(selectedJournal.totalDebit) - Number(selectedJournal.totalCredit)) > 0.01 && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
              Warning: Journal debits and credits do not balance perfectly!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
