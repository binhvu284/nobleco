import { NavLink } from 'react-router-dom';
import { IconDashboard, IconBox, IconWallet, IconShoppingBag, IconBook, IconUsers, IconChevronLeft, IconChevronRight, IconAddressBook } from '../../admin/components/icons';

export default function UserSidebar({ collapsed, onToggle, onNavigate, onMobileClose }: { collapsed: boolean; onToggle: () => void; onNavigate?: () => void; onMobileClose?: () => void }) {
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
                        <span>Nobleco</span>
                    </>
                )}
                <button className="icon-btn" aria-label={collapsed ? 'Expand' : 'Collapse'} onClick={handleToggleClick}>
                    {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
                </button>
            </div>
            <nav className="admin-nav">
                <NavLink to="/dashboard" onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <IconDashboard />
                    {!collapsed && <span>Dashboard</span>}
                </NavLink>
                <NavLink to="/member" onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <IconUsers />
                    {!collapsed && <span>My member</span>}
                </NavLink>
                <NavLink to="/client" onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <IconAddressBook />
                    {!collapsed && <span>Clients</span>}
                </NavLink>
                <NavLink to="/product" onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <IconBox />
                    {!collapsed && <span>Product</span>}
                </NavLink>
                <NavLink to="/wallet" onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <IconWallet />
                    {!collapsed && <span>Wallet</span>}
                </NavLink>
                <NavLink to="/orders" onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <IconShoppingBag />
                    {!collapsed && <span>Orders</span>}
                </NavLink>
                <NavLink to="/training" onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <IconBook />
                    {!collapsed && <span>Training</span>}
                </NavLink>
            </nav>
        </aside>
    );
}
