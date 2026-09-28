import React from 'react';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center" style={{ minHeight: '400px' }}>
      <h1 className="text-4xl font-bold text-primary mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-secondary mb-6 max-w-md">
        The page you are looking for doesn't exist or you don't have permission to access it.
      </p>
      <Link to="/dashboard" className="btn btn-primary flex items-center gap-2">
        <Home size={16} /> Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
