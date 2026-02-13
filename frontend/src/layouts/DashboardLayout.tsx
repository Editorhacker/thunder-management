import type { ReactNode } from 'react';
import { useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import TopNavbar from '../components/dashboard/TopNavbar';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="layout-container">
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapsed={() => setIsCollapsed(!isCollapsed)}
      />
      <main
        className="main-content"
        style={{ marginLeft: isCollapsed ? '86px' : '280px', width: `calc(100% - ${isCollapsed ? '86px' : '280px'})` }}
      >
        <TopNavbar />
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
