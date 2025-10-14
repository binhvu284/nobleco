import { NavLink } from 'react-router-dom';

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-logo">
        <img src="/images/logo.png" alt="Nobleco" width={28} height={28} />
        <span>Nobleco Admin</span>
      </div>
      <nav className="admin-nav">
        <NavLink to="/admin-dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
        <NavLink to="/admin-users" className={({ isActive }) => isActive ? 'active' : ''}>Users</NavLink>
      </nav>
    </aside>
  );
}
