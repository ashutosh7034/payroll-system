import React from 'react';
import { useLocation } from 'react-router-dom';
import { Hammer } from 'lucide-react';

const PlatformFeaturePlaceholder = () => {
  const location = useLocation();
  const path = location.pathname.split('/').pop();
  const title = path ? path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ') : 'Feature';

  return (
    <div className="app-content-inner flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
      <Hammer size={64} className="text-secondary mb-4 opacity-50" />
      <h2 className="page-title mb-2">{title} Management</h2>
      <p className="text-secondary mb-6 text-center" style={{ maxWidth: '400px' }}>
        This Platform Super Admin module is currently under construction and will be deployed in an upcoming phase.
      </p>
    </div>
  );
};

export default PlatformFeaturePlaceholder;
