import { NavLink } from 'react-router-dom';
import { IconDashboard, IconUsers, IconChevronLeft, IconChevronRight } from './icons';

export default function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
    return (
        <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="admin-logo">
                <img src="/images/logo.png" alt="Nobleco" width={28} height={28} />
                {!collapsed && <span>Nobleco Admin</span>}
                <button className="icon-btn" aria-label={collapsed ? 'Expand' : 'Collapse'} onClick={onToggle}>
                    {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
                </button>
            </div>
            <nav className="admin-nav">
                <NavLink to="/admin-dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                    <IconDashboard />
                    {!collapsed && <span>Dashboard</span>}
                </NavLink>
                <NavLink to="/admin-users" className={({ isActive }) => isActive ? 'active' : ''}>
                    <IconUsers />
                    {!collapsed && <span>Users</span>}
                </NavLink>
            </nav>
        </aside>
    );
}
