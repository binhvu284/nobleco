import { NavLink } from 'react-router-dom';
import { IconDashboard, IconUsers, IconChevronLeft, IconChevronRight, IconBox, IconPercent, IconWallet } from './icons';

export default function AdminSidebar({ collapsed, onToggle, onNavigate, onMobileClose }: { collapsed: boolean; onToggle: () => void; onNavigate?: () => void; onMobileClose?: () => void }) {
    const handleToggleClick = () => {
        // On mobile, close the sidebar
        if (onMobileClose && window.innerWidth <= 768) {
            onMobileClose();
        } else {
            // On desktop, toggle collapsed state
            onToggle();
        }
    };

    return (
        <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="admin-logo">
                {!collapsed && (
                    <>
                        <img src="/images/logo.png" alt="Nobleco" width={28} height={28} />
                        <span>Nobleco Admin</span>
                    </>
                )}
                <button className="icon-btn" aria-label={collapsed ? 'Expand' : 'Collapse'} onClick={handleToggleClick}>
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
                <NavLink to="/admin-product" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                    <IconBox />
                    {!collapsed && <span>Product</span>}
                </NavLink>
                <NavLink to="/admin-commission" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                    <IconPercent />
                    {!collapsed && <span>Commission</span>}
                </NavLink>
                <NavLink to="/admin-request" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                    <IconWallet />
                    {!collapsed && <span>Withdraw request</span>}
                </NavLink>
            </nav>
        </aside>
    );
}
