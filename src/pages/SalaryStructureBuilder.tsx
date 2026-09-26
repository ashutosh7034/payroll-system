import React, { useEffect, useState } from 'react';
import { Plus, Settings, AlertCircle, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SalaryStructureBuilder = () => {
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  
  const [testCtc, setTestCtc] = useState<number>(1200000);

  useEffect(() => {
    fetchStructures();
  }, []);

  const fetchStructures = async () => {
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/compensation/structures', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStructures(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-secondary" size={32} />
      </div>
    );
  }

  const structure = structures[0];

  const [previewResult, setPreviewResult] = useState<any>(null);
  
  const handleSimulate = async () => {
    if (!structure) return;
    const components = structure.components.map((sc: any) => ({
      code: sc.component.code,
      type: sc.component.type === 'STATUTORY' ? 'STATUTORY' : (sc.component.formulas?.[0]?.expression ? 'FORMULA' : 'FIXED'),
      expression: sc.component.formulas?.[0]?.expression
    }));
    
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/compensation/structures/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ctc: testCtc, components })
      });
      const data = await response.json();
      if (data.success) {
        setPreviewResult(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title mb-1">{structure?.name || 'New Structure'}</h1>
          <div className="flex items-center gap-3">
            <span className="badge badge-success">Active</span>
            <span className="text-secondary text-small">Version {structure?.version || 1} • {structure?.description}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={handleSimulate}>Simulate</button>
          <button className="btn btn-primary"><Save size={16} /> Save Draft</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Earnings</h2>
              <button className="btn-ghost text-small text-primary font-medium" style={{ padding: '4px 8px' }}>
                <Plus size={16} /> Add Component
              </button>
            </div>
            
            <table className="data-table mb-4">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Type</th>
                  <th>Calculation</th>
                  <th>Taxable</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {structure?.components?.filter((c: any) => c.component.type === 'EARNING').map((sc: any) => (
                  <tr key={sc.id}>
                    <td>
                      <div className="font-medium">{sc.component.name}</div>
                      <div className="text-small text-secondary">{sc.component.code}</div>
                    </td>
                    <td>{sc.component.type}</td>
                    <td className="font-mono text-xs text-secondary">Formula configured</td>
                    <td>{sc.component.isTaxable ? 'Yes' : 'No'}</td>
                    <td><button className="btn-ghost p-1"><Settings size={14}/></button></td>
                  </tr>
                ))}
                {!structure?.components?.length && (
                  <tr>
                    <td colSpan={5} className="text-center text-secondary py-4">No earning components</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Deductions (Statutory & Standard)</h2>
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Type</th>
                  <th>Rule Binding</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {structure?.components?.filter((c: any) => c.component.type === 'STATUTORY').map((sc: any) => (
                  <tr key={sc.id}>
                    <td>
                      <div className="font-medium">{sc.component.name}</div>
                      <div className="text-small text-secondary">{sc.component.code}</div>
                    </td>
                    <td>{sc.component.type}</td>
                    <td><span className="text-primary text-small underline cursor-pointer">Formula configured</span></td>
                    <td><button className="btn-ghost p-1"><Settings size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card bg-surface-hover" style={{ backgroundColor: '#FAFAFA' }}>
            <h2 className="card-title mb-4">Structure Preview</h2>
            
            <div className="form-group">
              <label className="form-label">Test Annual CTC</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>₹</span>
                <input 
                  type="number" 
                  className="form-input" 
                  value={testCtc} 
                  onChange={(e) => setTestCtc(Number(e.target.value))}
                  style={{ paddingLeft: '28px', backgroundColor: 'var(--bg-surface)' }} 
                />
              </div>
            </div>

            
            <div className="border-t border-light mt-4 pt-4 flex-col gap-2">
              <div className="flex justify-between text-small">
                <span>Monthly CTC</span>
                <span className="font-medium">₹{(testCtc / 12).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              
              {previewResult && Object.keys(previewResult).filter(k => k !== 'CTC').map(key => (
                 <div key={key} className="flex justify-between text-small text-secondary">
                   <span>{key}</span>
                   <span>₹{(previewResult[key] / 12).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                 </div>
              ))}
              
              {!previewResult && (
                 <div className="text-small text-secondary text-center py-4 italic">
                   Click simulate to preview structure components from the backend API.
                 </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-2 items-start text-small text-secondary p-3 bg-surface rounded-md" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
              <AlertCircle size={14} className="text-warning flex-shrink-0 mt-0.5" />
              <span>Income tax (TDS) is not included in this preview as it depends on individual tax declarations.</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryStructureBuilder;
