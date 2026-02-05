import { Link, useLocation } from 'react-router-dom';
import { MdDashboard, MdAnalytics } from 'react-icons/md';
import { useState } from 'react';
import { FaUserShield, FaGamepad } from 'react-icons/fa';
import { FaBolt } from 'react-icons/fa';
import PlayerThunderSearchModal from './PlayerThunderSearch';



const Sidebar = () => {
  const location = useLocation();
  const [openSearch, setOpenSearch] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <div className="logo-icon">
          <FaGamepad size={28} color="var(--accent-yellow)" />
        </div>
        <h1 className="logo-text">Thunder <br /><span className="highlight">Gaming</span></h1>
      </div>
      <nav className="nav-menu">
        <Link to="/employee" className={`nav-item ${isActive('/employee') ? 'active' : ''}`}>
          <MdDashboard size={22} />
          <span>Dashboard</span>
        </Link>
        <Link to="/analytic" className={`nav-item ${isActive('/analytic') ? 'active' : ''}`}>
          <MdAnalytics size={22} />
          <span>Analysis</span>
        </Link>
        <Link to="/owner" className={`nav-item ${isActive('/owner') ? 'active' : ''}`}>
          <FaUserShield size={22} />
          <span>Owner</span>
        </Link>

        <button
          className="nav-item"
          style={{ marginTop: 'auto' }}
          onClick={() => setOpenSearch(true)}
        >
          <FaBolt size={22} />
          <span>Search Player</span>
        </button>

        <PlayerThunderSearchModal
          open={openSearch}
          onClose={() => setOpenSearch(false)}
        />

      </nav>


      <style>{`
        .sidebar {
          width: 260px;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100vh;
          padding: 1.5rem 1rem;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 3rem;
          padding: 0 0.5rem;
        }

        .logo-icon {
          background: rgba(251, 191, 36, 0.1);
          padding: 8px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(251, 191, 36, 0.2);
        }

        .logo-text {
          font-family: var(--font-display);
          font-size: 1.1rem;
          line-height: 1.2;
          color: var(--text-primary);
          text-transform: uppercase;
        }
        
        .highlight {
          color: var(--accent-yellow);
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s;
  font-weight: 500;
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.nav-item:focus {
  outline: none;
}


        .nav-item:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: linear-gradient(90deg, rgba(251, 191, 36, 0.1) 0%, transparent 100%);
          color: var(--accent-yellow);
          border-left: 3px solid var(--accent-yellow);
        }
          .player-search {
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.player-search-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent-yellow);
  margin-bottom: 0.75rem;
}

.player-search-input {
  width: 100%;
  padding: 8px 10px;
  background: #0f0f12;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #fff;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.player-search-btn {
  width: 100%;
  padding: 8px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.player-search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.player-search-result {
  margin-top: 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.75rem;
  border-radius: 10px;
  text-align: center;
}

.result-name {
  font-weight: 700;
  font-size: 0.9rem;
}

.result-phone {
  font-size: 0.7rem;
  color: #71717a;
}

.result-coins {
  margin-top: 4px;
  font-weight: 800;
  color: #facc15;
  display: flex;
  justify-content: center;
  gap: 4px;
}

.player-search-error {
  margin-top: 6px;
  font-size: 0.7rem;
  color: #ef4444;
  text-align: center;
}

      `}</style>
    </aside>
  );
};

export default Sidebar;
