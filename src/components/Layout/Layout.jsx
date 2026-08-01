import { NavLink } from 'react-router-dom';
import './Layout.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/portfolio', label: 'Portfolio', icon: '💼' },
];

export default function Layout({ children }) {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-logo">
          <h2>FinancasFirebase</h2>
          <span className="header-subtitle">Portfolio Analyzer</span>
        </div>
        <nav className="header-nav">
          {navItems.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}
