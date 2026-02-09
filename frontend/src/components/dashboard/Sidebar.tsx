import { Link, useLocation } from 'react-router-dom';
import { MdDashboard, MdAnalytics, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { useState } from 'react';
import { FaUserShield, FaGamepad } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './Sidebar.css';

interface SidebarProps {
  isCollapsed?: boolean;
  toggleCollapsed?: () => void;
}

const navItems = [
  { path: '/employee', icon: MdDashboard, label: 'Dashboard' },
  { path: '/analytic', icon: MdAnalytics, label: 'Analysis' },
  { path: '/owner', icon: FaUserShield, label: 'Owner' },
];

const Sidebar = ({ isCollapsed = false, toggleCollapsed }: SidebarProps) => {
  const location = useLocation();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.aside
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      animate={{ width: isCollapsed ? 86 : 280 }}
      transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
    >
      <button
        className="toggle-btn"
        onClick={toggleCollapsed}
        aria-label="Toggle Sidebar"
      >
        {isCollapsed ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
      </button>

      <div
        className="logo-section"
        onClick={toggleCollapsed}
      >
        <motion.div
          className="logo-icon-wrapper"
          whileHover={{ rotate: 15, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <FaGamepad size={28} color="var(--accent-yellow)" />
        </motion.div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="logo-text"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              Thunder <br /><span className="highlight">Gaming</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <div key={item.path} className="nav-item-container">
              <Link
                to={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onMouseEnter={() => setHoveredPath(item.path)}
                onMouseLeave={() => setHoveredPath(null)}
                data-tooltip={isCollapsed ? item.label : undefined}
              >
                {/* Active Indicator Line */}
                {active && (
                  <motion.div
                    layoutId="active-indicator"
                    className="active-indicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Hover Background */}
                <AnimatePresence>
                  {hoveredPath === item.path && !active && (
                    <motion.div
                      className="hover-bg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        zIndex: -1
                      }}
                    />
                  )}
                </AnimatePresence>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: isCollapsed ? '100%' : 'auto' }}>
                  <item.icon size={22} className={active ? 'glow-icon' : ''} />
                </div>


                {!isCollapsed && (
                  <motion.span
                    className="nav-item-label"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                )}


                {/* Active Glow Effect */}
                {active && (
                  <motion.div
                    layoutId="active-glow"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '12px',
                      background: 'linear-gradient(90deg, rgba(251, 191, 36, 0.1) 0%, transparent 100%)',
                      zIndex: -1
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </div>
          );
        })}
      </nav>
    </motion.aside>
  );
};

export default Sidebar;
