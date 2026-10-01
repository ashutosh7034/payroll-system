const fs = require('fs');
let code = fs.readFileSync('src/pages/Organization.tsx', 'utf8');

const target1 = `        <button 
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '14px', fontWeight: activeTab === 'departments' ? 600 : 500,
            color: activeTab === 'departments' ? 'var(--primary-dark)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'departments' ? '2px solid var(--primary-dark)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: '-1px'
          }}
          onClick={() => { setActiveTab('departments'); setSearchQuery(''); }}
        >
          Departments ({data.departments.length})
        </button>
        <button 
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '14px', fontWeight: activeTab === 'locations' ? 600 : 500,
            color: activeTab === 'locations' ? 'var(--primary-dark)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'locations' ? '2px solid var(--primary-dark)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: '-1px'
          }}
          onClick={() => { setActiveTab('locations'); setSearchQuery(''); }}
        >
          Locations ({data.locations.length})
        </button>`;

const replacement1 = `        <button 
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '14px', fontWeight: activeTab === 'departments' ? 600 : 500,
            color: activeTab === 'departments' ? 'var(--primary-dark)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'departments' ? '2px solid var(--primary-dark)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: '-1px'
          }}
          onClick={() => { setActiveTab('departments'); setSearchQuery(''); }}
        >
          Departments ({data.departments.length})
        </button>
        <button 
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '14px', fontWeight: activeTab === 'locations' ? 600 : 500,
            color: activeTab === 'locations' ? 'var(--primary-dark)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'locations' ? '2px solid var(--primary-dark)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: '-1px'
          }}
          onClick={() => { setActiveTab('locations'); setSearchQuery(''); }}
        >
          Locations ({data.locations.length})
        </button>
        <button 
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '14px', fontWeight: activeTab === 'legalEntities' ? 600 : 500,
            color: activeTab === 'legalEntities' ? 'var(--primary-dark)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'legalEntities' ? '2px solid var(--primary-dark)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: '-1px', whiteSpace: 'nowrap'
          }}
          onClick={() => { setActiveTab('legalEntities'); setSearchQuery(''); }}
        >
          Legal Entities ({data.legalEntities.length})
        </button>
        <button 
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '14px', fontWeight: activeTab === 'costCenters' ? 600 : 500,
            color: activeTab === 'costCenters' ? 'var(--primary-dark)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'costCenters' ? '2px solid var(--primary-dark)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: '-1px', whiteSpace: 'nowrap'
          }}
          onClick={() => { setActiveTab('costCenters'); setSearchQuery(''); }}
        >
          Cost Centers ({data.costCenters.length})
        </button>`;

code = code.replace(target1, replacement1);

const target2 = `        </div>
  
        {/* DEPARTMENT MODAL */}`;
const replacement2 = `          {activeTab === 'legalEntities' && (
            <div style={{ padding: '24px' }}>
              <OrganizationLegalEntities legalEntities={data.legalEntities} canManage={canManage} onRefresh={fetchData} />
            </div>
          )}

          {activeTab === 'costCenters' && (
            <div style={{ padding: '24px' }}>
              <OrganizationCostCenters costCenters={data.costCenters} canManage={canManage} onRefresh={fetchData} />
            </div>
          )}
        </div>
  
        {/* DEPARTMENT MODAL */}`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/pages/Organization.tsx', code);
console.log('Patched');
