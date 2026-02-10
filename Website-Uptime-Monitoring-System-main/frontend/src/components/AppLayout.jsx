import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/layout.css';

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div>
          <h1>Uptime Sentinel</h1>
          <p>{user?.name} · {user?.email}</p>
        </div>

        <nav>
          <NavLink to="/app/add-website">Add Website</NavLink>
          <NavLink to="/app/websites">My Websites</NavLink>
          <NavLink to="/app/overview">Overview</NavLink>
        </nav>

        <button onClick={logout}>Logout</button>
      </header>

      <section className="content-panel">
        <Outlet />
      </section>
    </div>
  );
}
