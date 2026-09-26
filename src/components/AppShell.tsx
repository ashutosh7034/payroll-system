import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppShell = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <div className="app-content-wrapper">
          <div className="app-content-inner">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
