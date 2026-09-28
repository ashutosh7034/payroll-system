import React, { useState } from 'react';
import { Calculator, TrendingUp, Users, RefreshCw, Save, ArrowRight, Play, Settings } from 'lucide-react';

const Simulation = () => {
  const [activeTab, setActiveTab] = useState('SALARY_REVISION');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [assumptions, setAssumptions] = useState({
    hikePercentage: 8,
    employeeCount: 50,
    currentCost: 4500000
  });

  const runSimulation = () => {
    setRunning(true);
    setTimeout(() => {
      const newCost = assumptions.currentCost * (1 + (assumptions.hikePercentage / 100));
      setResults({
        previousCost: assumptions.currentCost,
        newCost: newCost,
        variance: newCost - assumptions.currentCost,
        variancePercentage: assumptions.hikePercentage,
        headcountImpact: 0,
        runDate: new Date()
      });
      setRunning(false);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title mb-1">Simulation & Intelligence</h1>
          <p className="text-small text-secondary">Run what-if scenarios and forecast payroll impact without modifying production data.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary flex items-center gap-2"><Save size={16} /> Saved Scenarios</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card md:col-span-1 p-0 flex flex-col h-fit overflow-hidden">
          <div className="p-4 border-b border-[var(--border-light)] bg-[var(--bg-app)]">
            <h3 className="font-semibold text-[13px] tracking-wide text-secondary uppercase">Scenario Models</h3>
          </div>
          <div className="flex flex-col">
            {[
              { id: 'SALARY_REVISION', name: 'Salary Revision Impact', icon: <TrendingUp size={16} /> },
              { id: 'HEADCOUNT', name: 'Headcount Change Impact', icon: <Users size={16} /> },
              { id: 'BONUS', name: 'Bonus & Variable Pay', icon: <Calculator size={16} /> }
            ].map(model => (
              <button
                key={model.id}
                onClick={() => { setActiveTab(model.id); setResults(null); }}
                className={`flex items-center gap-3 p-4 border-b border-[var(--border-light)] text-left transition-colors ${activeTab === model.id ? 'bg-[var(--bg-surface-active)] text-primary font-medium border-l-2 border-l-[var(--primary-color)]' : 'bg-transparent text-secondary hover:bg-[var(--bg-surface-hover)] border-l-2 border-l-transparent'}`}
              >
                {model.icon}
                <span className="text-[14px]">{model.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 flex flex-col gap-6">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="card-title m-0 flex items-center gap-2">
                <Settings size={18} className="text-secondary" />
                Simulation Assumptions
              </h2>
              <button 
                className="btn btn-primary flex items-center gap-2"
                onClick={runSimulation}
                disabled={running}
              >
                {running ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                {running ? 'Running...' : 'Run Simulation'}
              </button>
            </div>

            {activeTab === 'SALARY_REVISION' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Average Hike Percentage (%)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={assumptions.hikePercentage} 
                    onChange={e => setAssumptions({...assumptions, hikePercentage: Number(e.target.value)})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Population (Employees)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={assumptions.employeeCount} 
                    onChange={e => setAssumptions({...assumptions, employeeCount: Number(e.target.value)})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Baseline Payroll Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary">₹</span>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ paddingLeft: '28px' }}
                      value={assumptions.currentCost} 
                      onChange={e => setAssumptions({...assumptions, currentCost: Number(e.target.value)})} 
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab !== 'SALARY_REVISION' && (
              <div className="py-8 text-center text-secondary border-2 border-dashed border-[var(--border-light)] rounded bg-[var(--bg-app)]">
                <p>Select Salary Revision to test active model.</p>
              </div>
            )}
          </div>

          {results && (
            <div className="card border-[var(--primary-light)] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="card-title text-[var(--primary-dark)] m-0">Simulation Results</h2>
                  <p className="text-small text-secondary mt-1">Generated on {results.runDate.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <span className="badge badge-warning">NOT FINAL PAYROLL</span>
                  <span className="badge badge-success">ESTIMATED</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="p-4 rounded border border-[var(--border-light)] bg-[var(--bg-app)]">
                  <div className="text-small text-secondary mb-1">Current Payroll Cost</div>
                  <div className="text-xl font-bold">₹{results.previousCost.toLocaleString()}</div>
                </div>
                <div className="p-4 rounded border border-[var(--border-light)] flex items-center justify-center">
                  <ArrowRight size={24} className="text-secondary" />
                </div>
                <div className="p-4 rounded border border-[var(--primary-light)] bg-[var(--bg-surface-active)]">
                  <div className="text-small text-[var(--primary-dark)] font-medium mb-1">Simulated Payroll Cost</div>
                  <div className="text-xl font-bold text-[var(--primary-color)]">₹{results.newCost.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="p-4 rounded bg-green-50 border border-green-100 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-green-800">Financial Impact</h4>
                  <p className="text-small text-green-700 mt-1">Overall variance based on applied assumptions.</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-700">+₹{results.variance.toLocaleString()}</div>
                  <div className="text-small font-medium text-green-600">+{results.variancePercentage}% increase</div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button className="btn btn-secondary">Export PDF</button>
                <button className="btn btn-primary" onClick={() => { alert('Scenario saved to workspace.'); setResults(null); }}>Save Scenario</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulation;
