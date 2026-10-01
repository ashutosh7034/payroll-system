const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeesList.tsx', 'utf8');

const importTarget = `import { useAuth } from '../contexts/AuthContext';`;
const importReplacement = `import { useAuth } from '../contexts/AuthContext';
import EmployeeDetailModal from '../components/employee/EmployeeDetailModal';`;
code = code.replace(importTarget, importReplacement);

const stateTarget = `  const [showAddModal, setShowAddModal] = useState(false);`;
const stateReplacement = `  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);`;
code = code.replace(stateTarget, stateReplacement);

const actionTarget = `<td style={{ textAlign: 'center' }}>
                      <button className="btn-ghost" style={{ padding: '6px', color: 'var(--text-secondary)' }}>
                        <MoreHorizontal size={16} />
                      </button>
                    </td>`;
const actionReplacement = `<td style={{ textAlign: 'center' }}>
                      <button className="btn-ghost" style={{ padding: '6px', color: 'var(--text-secondary)' }} onClick={() => setSelectedEmployeeId(emp.id)}>
                        <MoreHorizontal size={16} />
                      </button>
                    </td>`;
code = code.replace(actionTarget, actionReplacement);

const modalTarget = `      <EmployeeFormModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        token={token}
        orgData={orgData}
        onSuccess={() => {
          setShowAddModal(false);
          fetchEmployees();
        }}
      />`;
const modalReplacement = `      <EmployeeFormModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        token={token}
        orgData={orgData}
        onSuccess={() => {
          setShowAddModal(false);
          fetchEmployees();
        }}
      />
      <EmployeeDetailModal
        isOpen={!!selectedEmployeeId}
        employeeId={selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
      />`;
code = code.replace(modalTarget, modalReplacement);

fs.writeFileSync('src/pages/EmployeesList.tsx', code);
console.log('Patched EmployeesList.tsx');
