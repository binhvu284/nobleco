import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { IconDashboard, IconBox, IconWallet, IconShoppingBag, IconBook, IconUsers, IconChevronLeft, IconChevronRight, IconAddressBook, IconMail, IconLibrary, IconChevronDown, IconChevronUp } from '../../admin/components/icons';

export default function UserSidebar({ collapsed, onToggle, onNavigate, onMobileClose }: { collapsed: boolean; onToggle: () => void; onNavigate?: () => void; onMobileClose?: () => void }) {
    const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>(() => {
        const saved = localStorage.getItem('user-sidebar-sections');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return { materials: true };
            }
        }
        return { materials: true };
    });
    
    const location = useLocation();

    const handleToggleClick = () => {
        // On mobile, close the sidebar
        if (onMobileClose && window.innerWidth <= 768) {
            onMobileClose();
        } else {
            // On desktop, toggle collapsed state
            onToggle();
        }
    };

    const toggleSection = (section: string) => {
        if (collapsed) return; // Don't toggle sections when sidebar is collapsed
        const newState = {
            ...openSections,
            [section]: !openSections[section]
        };
        setOpenSections(newState);
        localStorage.setItem('user-sidebar-sections', JSON.stringify(newState));
    };

    const isSectionActive = (paths: string[]) => {
        return paths.some(path => location.pathname.startsWith(path));
    };

    const isMaterialsActive = isSectionActive(['/library', '/training-materials']);

    useEffect(() => {
        const saved = localStorage.getItem('user-sidebar-sections');
        if (saved) {
            try {
                const parsedState = JSON.parse(saved);
                setOpenSections(parsedState);
            } catch (e) {
                setOpenSections({ materials: true });
            }
        }
    }, []);

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
                <NavLink to="/inbox" onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <IconMail />
                    {!collapsed && <span>Inbox</span>}
                </NavLink>
                {!collapsed && <div className="nav-divider"></div>}
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
                {/* Materials Section */}
                <div className={`nav-section ${isMaterialsActive ? 'active' : ''}`}>
                    {!collapsed ? (
                        <>
                            <button 
                                className="section-header" 
                                onClick={() => toggleSection('materials')}
                                type="button"
                            >
                                <span className="section-title">MATERIALS</span>
                                <span className="section-toggle">
                                    {openSections.materials ? <IconChevronUp /> : <IconChevronDown />}
                                </span>
                            </button>
                            {openSections.materials && (
                                <nav className="section-content">
                                    <NavLink to="/library" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                        <IconLibrary />
                                        <span>Library</span>
                                    </NavLink>
                                    <NavLink to="/training-materials" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                        <IconBook />
                                        <span>Training Materials</span>
                                    </NavLink>
                                </nav>
                            )}
                        </>
                    ) : (
                        <div className="collapsed-section">
                            <NavLink to="/library" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title="Library">
                                <IconLibrary />
                            </NavLink>
                            <NavLink to="/training-materials" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title="Training Materials">
                                <IconBook />
                            </NavLink>
                        </div>
                    )}
                </div>
            </nav>
        </aside>
    );
}
