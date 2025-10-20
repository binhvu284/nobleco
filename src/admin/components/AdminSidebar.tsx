import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    IconDashboard, 
    IconUsers, 
    IconAdmin,
    IconChevronLeft, 
    IconChevronRight, 
    IconBox,
    IconPercent, 
    IconWallet, 
    IconChevronDown, 
    IconChevronUp, 
    IconAddressBook, 
    IconShoppingBag, 
    IconTag, 
    IconCreditCard,
    IconMoreVertical
} from './icons';

export default function AdminSidebar({ collapsed, onToggle, onNavigate, onMobileClose }: { collapsed: boolean; onToggle: () => void; onNavigate?: () => void; onMobileClose?: () => void }) {
    // Load saved state from localStorage or use defaults
    const getInitialSections = () => {
        const saved = localStorage.getItem('admin-sidebar-sections');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return { users: true, products: true, payment: true };
            }
        }
        return { users: true, products: true, payment: true };
    };

    const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>(getInitialSections);
    
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
        // Save to localStorage
        localStorage.setItem('admin-sidebar-sections', JSON.stringify(newState));
    };

    const isSectionActive = (section: string, paths: string[]) => {
        return paths.some(path => location.pathname.startsWith(path));
    };

    // Only show active styling when actually on a page within that section
    const isUsersActive = isSectionActive('users', ['/admin-users', '/admin-admin-users', '/admin-clients']);
    const isProductsActive = isSectionActive('products', ['/admin-products', '/admin-category', '/admin-orders']);
    const isPaymentActive = isSectionActive('payment', ['/admin-commission', '/admin-request']);

    // Load state from localStorage on component mount
    useEffect(() => {
        const saved = localStorage.getItem('admin-sidebar-sections');
        if (saved) {
            try {
                const parsedState = JSON.parse(saved);
                setOpenSections(parsedState);
            } catch (e) {
                // If parsing fails, use defaults
                setOpenSections({ users: true, products: true, payment: true });
            }
        }
    }, []);

    return (
        <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="admin-logo">
                {!collapsed && <span>Nobleco Admin</span>}
                <button className="icon-btn" aria-label={collapsed ? 'Expand' : 'Collapse'} onClick={handleToggleClick}>
                    {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
                </button>
            </div>
            <nav className="admin-nav">
                {/* Dashboard - Always visible */}
                <NavLink to="/admin-dashboard" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                    <IconDashboard />
                    {!collapsed && <span>Dashboard</span>}
                </NavLink>

                {/* Users Section */}
                <div className={`nav-section ${isUsersActive ? 'active' : ''}`}>
                    {!collapsed ? (
                        <>
                            <button 
                                className="section-header" 
                                onClick={() => toggleSection('users')}
                                type="button"
                            >
                                <span className="section-title">USERS</span>
                                <span className="section-toggle">
                                    {openSections.users ? <IconChevronUp /> : <IconChevronDown />}
                                </span>
                            </button>
                            {openSections.users && (
                                <nav className="section-content">
                                    <NavLink to="/admin-users" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                        <IconUsers />
                                        <span>Users</span>
                                    </NavLink>
                                    <NavLink to="/admin-admin-users" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                        <IconAdmin />
                                        <span>Admin Users</span>
                                    </NavLink>
                                    <NavLink to="/admin-clients" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                        <IconAddressBook />
                                        <span>Clients</span>
                                    </NavLink>
                                </nav>
                            )}
                        </>
                    ) : (
                        /* Collapsed state - show all user page icons */
                        <div className="collapsed-section">
                            <NavLink to="/admin-users" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title="Users">
                                <IconUsers />
                            </NavLink>
                            <NavLink to="/admin-admin-users" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title="Admin Users">
                                <IconAdmin />
                            </NavLink>
                            <NavLink to="/admin-clients" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title="Clients">
                                <IconAddressBook />
                            </NavLink>
                        </div>
                    )}
                </div>

                {/* Products Section */}
                <div className={`nav-section ${isProductsActive ? 'active' : ''}`}>
                    {!collapsed ? (
                        <>
                            <button 
                                className="section-header" 
                                onClick={() => toggleSection('products')}
                                type="button"
                            >
                                <span className="section-title">PRODUCTS</span>
                                <span className="section-toggle">
                                    {openSections.products ? <IconChevronUp /> : <IconChevronDown />}
                                </span>
                            </button>
                            {openSections.products && (
                                <nav className="section-content">
                                    <NavLink to="/admin-products" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                        <IconBox />
                                        <span>Products</span>
                                    </NavLink>
                                    <NavLink to="/admin-category" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                        <IconTag />
                                        <span>Category</span>
                                    </NavLink>
                                    <NavLink to="/admin-orders" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                        <IconShoppingBag />
                                        <span>Orders</span>
                                    </NavLink>
                                </nav>
                            )}
                        </>
                    ) : (
                        /* Collapsed state - show all product page icons */
                        <div className="collapsed-section">
                            <NavLink to="/admin-products" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title="Products">
                                <IconBox />
                            </NavLink>
                            <NavLink to="/admin-category" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title="Category">
                                <IconTag />
                            </NavLink>
                            <NavLink to="/admin-orders" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title="Orders">
                                <IconShoppingBag />
                            </NavLink>
                        </div>
                    )}
                </div>

                {/* Payment Section */}
                <div className={`nav-section ${isPaymentActive ? 'active' : ''}`}>
                    {!collapsed ? (
                        <>
                            <button 
                                className="section-header" 
                                onClick={() => toggleSection('payment')}
                                type="button"
                            >
                                <span className="section-title">PAYMENT</span>
                                <span className="section-toggle">
                                    {openSections.payment ? <IconChevronUp /> : <IconChevronDown />}
                                </span>
                            </button>
                            {openSections.payment && (
                                <nav className="section-content">
                                    <NavLink to="/admin-commission" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                        <IconPercent />
                                        <span>Commission</span>
                                    </NavLink>
                                    <NavLink to="/admin-request" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                        <IconWallet />
                                        <span>Withdraw Request</span>
                                    </NavLink>
                                </nav>
                            )}
                        </>
                    ) : (
                        /* Collapsed state - show all payment page icons */
                        <div className="collapsed-section">
                            <NavLink to="/admin-commission" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title="Commission">
                                <IconPercent />
                            </NavLink>
                            <NavLink to="/admin-request" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title="Withdraw Request">
                                <IconWallet />
                            </NavLink>
                        </div>
                    )}
                </div>
            </nav>
        </aside>
    );
}
