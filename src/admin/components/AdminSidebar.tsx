import { NavLink } from 'react-router-dom';
import { IconDashboard, IconUsers, IconChevronLeft, IconChevronRight } from './icons';

export default function AdminSidebar({ collapsed, onToggle, onNavigate }: { collapsed: boolean; onToggle: () => void; onNavigate?: () => void }) {
    return (
        <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="admin-logo">
                {!collapsed && (
                    <>
                        <img src="/images/logo.png" alt="Nobleco" width={28} height={28} />
                        <span>Nobleco Admin</span>
                    </>
                )}
                <button className="icon-btn" aria-label={collapsed ? 'Expand' : 'Collapse'} onClick={onToggle}>
                    {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
                </button>
            </div>
            <nav className="admin-nav">
                <NavLink to="/admin-dashboard" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                    <IconDashboard />
                    {!collapsed && <span>Dashboard</span>}
                </NavLink>
                <NavLink to="/admin-users" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                    <IconUsers />
                    {!collapsed && <span>Users</span>}
                </NavLink>
            </nav>
        </aside>
    );
}
