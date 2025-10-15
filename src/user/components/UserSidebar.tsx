import { NavLink } from 'react-router-dom';
import { IconDashboard, IconBox, IconWallet, IconCreditCard, IconBook, IconChevronLeft, IconChevronRight } from '../../admin/components/icons';

export default function UserSidebar({ collapsed, onToggle, onNavigate }: { collapsed: boolean; onToggle: () => void; onNavigate?: () => void }) {
    return (
        <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="admin-logo">
                {!collapsed && (
                    <>
                        <img src="/images/logo.png" alt="Nobleco" width={28} height={28} />
                        <span>Nobleco</span>
                    </>
                )}
                <button className="icon-btn" aria-label={collapsed ? 'Expand' : 'Collapse'} onClick={onToggle}>
                    {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
                </button>
            </div>
            <nav className="admin-nav">
                <NavLink to="/dashboard" onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <IconDashboard />
                    {!collapsed && <span>Dashboard</span>}
                </NavLink>
                <NavLink to="/product" onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <IconBox />
                    {!collapsed && <span>Product</span>}
                </NavLink>
                <NavLink to="/wallet" onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <IconWallet />
                    {!collapsed && <span>Wallet</span>}
                </NavLink>
                <NavLink to="/payment" onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <IconCreditCard />
                    {!collapsed && <span>Payment</span>}
                </NavLink>
                <NavLink to="/training" onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <IconBook />
                    {!collapsed && <span>Training</span>}
                </NavLink>
            </nav>
        </aside>
    );
}
