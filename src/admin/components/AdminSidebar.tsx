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
    IconMoreVertical,
    IconTicket,
    IconBarChart
} from './icons';
import { getCurrentUser } from '../../auth';
import { useTranslation } from '../../shared/contexts/TranslationContext';

export default function AdminSidebar({ collapsed, onToggle, onNavigate, onMobileClose }: { collapsed: boolean; onToggle: () => void; onNavigate?: () => void; onMobileClose?: () => void }) {
    const { t } = useTranslation();
    const [coworkerPermissions, setCoworkerPermissions] = useState<string[]>([]);
    const currentUser = getCurrentUser();
    const isCoworker = currentUser?.role === 'coworker';

    // Fetch coworker permissions
    useEffect(() => {
        if (isCoworker && currentUser?.id) {
            const authToken = localStorage.getItem('nobleco_auth_token');
            fetch(`/api/coworker-permissions?coworkerId=${currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setCoworkerPermissions(data.map((p: any) => p.page_path));
                    }
                })
                .catch(err => {
                    console.error('Error fetching coworker permissions:', err);
                });
        }
    }, [isCoworker, currentUser?.id]);

    // Helper function to check if coworker has access to a page
    const hasAccess = (pagePath: string): boolean => {
        if (!isCoworker) return true; // Admin has access to everything
        return coworkerPermissions.includes(pagePath);
    };
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
    const isProductsActive = isSectionActive('products', ['/admin-products', '/admin-categories', '/admin-orders']);
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
                <button className="icon-btn" aria-label={collapsed ? t('common.expand') : t('common.collapse')} onClick={handleToggleClick}>
                    {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
                </button>
            </div>
            <nav className="admin-nav">
                {/* Dashboard - Always visible if has access */}
                {hasAccess('/admin-dashboard') && (
                    <NavLink to="/admin-dashboard" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                        <IconDashboard />
                        {!collapsed && <span>{t('sidebar.dashboard')}</span>}
                    </NavLink>
                )}

                {/* Business Analytics - Admin only (not for coworkers) */}
                {!isCoworker && (
                    <NavLink to="/admin-analytics" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                        <IconBarChart />
                        {!collapsed && <span>{t('sidebar.businessAnalytics')}</span>}
                    </NavLink>
                )}

                {/* Users Section - Only show if has access to at least one page */}
                {(hasAccess('/admin-users') || hasAccess('/admin-admin-users') || hasAccess('/admin-clients')) && (
                    <div className={`nav-section ${isUsersActive ? 'active' : ''}`}>
                    {!collapsed ? (
                        <>
                            <button 
                                className="section-header" 
                                onClick={() => toggleSection('users')}
                                type="button"
                            >
                                <span className="section-title">{t('sidebar.users').toUpperCase()}</span>
                                <span className="section-toggle">
                                    {openSections.users ? <IconChevronUp /> : <IconChevronDown />}
                                </span>
                            </button>
                            {openSections.users && (
                                <nav className="section-content">
                                    {hasAccess('/admin-users') && (
                                        <NavLink to="/admin-users" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                            <IconUsers />
                                            <span>{t('sidebar.users')}</span>
                                        </NavLink>
                                    )}
                                    {hasAccess('/admin-admin-users') && (
                                        <NavLink to="/admin-admin-users" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                            <IconAdmin />
                                            <span>{t('sidebar.adminUsers')}</span>
                                        </NavLink>
                                    )}
                                    {hasAccess('/admin-clients') && (
                                        <NavLink to="/admin-clients" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                            <IconAddressBook />
                                            <span>{t('sidebar.clients')}</span>
                                        </NavLink>
                                    )}
                                </nav>
                            )}
                        </>
                    ) : (
                        /* Collapsed state - show all user page icons */
                        <div className="collapsed-section">
                            {hasAccess('/admin-users') && (
                                <NavLink to="/admin-users" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title={t('sidebar.users')}>
                                    <IconUsers />
                                </NavLink>
                            )}
                            {hasAccess('/admin-admin-users') && (
                                <NavLink to="/admin-admin-users" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title={t('sidebar.adminUsers')}>
                                    <IconAdmin />
                                </NavLink>
                            )}
                            {hasAccess('/admin-clients') && (
                                <NavLink to="/admin-clients" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title={t('sidebar.clients')}>
                                    <IconAddressBook />
                                </NavLink>
                            )}
                        </div>
                    )}
                </div>
                )}

                {/* Products Section - Only show if has access to at least one page */}
                {(hasAccess('/admin-products') || hasAccess('/admin-categories') || hasAccess('/admin-orders')) && (
                    <div className={`nav-section ${isProductsActive ? 'active' : ''}`}>
                        {!collapsed ? (
                            <>
                                <button 
                                    className="section-header" 
                                    onClick={() => toggleSection('products')}
                                    type="button"
                                >
                                    <span className="section-title">{t('sidebar.products').toUpperCase()}</span>
                                    <span className="section-toggle">
                                        {openSections.products ? <IconChevronUp /> : <IconChevronDown />}
                                    </span>
                                </button>
                                {openSections.products && (
                                    <nav className="section-content">
                                        {hasAccess('/admin-products') && (
                                            <NavLink to="/admin-products" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                                <IconBox />
                                                <span>{t('sidebar.products')}</span>
                                            </NavLink>
                                        )}
                                        {hasAccess('/admin-categories') && (
                                            <NavLink to="/admin-categories" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                                <IconTag />
                                                <span>{t('sidebar.categories')}</span>
                                            </NavLink>
                                        )}
                                        {hasAccess('/admin-orders') && (
                                            <NavLink to="/admin-orders" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                                <IconShoppingBag />
                                                <span>{t('sidebar.orders')}</span>
                                            </NavLink>
                                        )}
                                    </nav>
                                )}
                            </>
                        ) : (
                            /* Collapsed state - show all product page icons */
                            <div className="collapsed-section">
                                {hasAccess('/admin-products') && (
                                    <NavLink to="/admin-products" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title={t('sidebar.products')}>
                                        <IconBox />
                                    </NavLink>
                                )}
                                {hasAccess('/admin-categories') && (
                                    <NavLink to="/admin-categories" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title={t('sidebar.categories')}>
                                        <IconTag />
                                    </NavLink>
                                )}
                                {hasAccess('/admin-orders') && (
                                    <NavLink to="/admin-orders" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title={t('sidebar.orders')}>
                                        <IconShoppingBag />
                                    </NavLink>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Payment Section - Only show if has access to at least one page */}
                {(hasAccess('/admin-commission') || hasAccess('/admin-request') || hasAccess('/admin-discount')) && (
                    <div className={`nav-section ${isPaymentActive ? 'active' : ''}`}>
                        {!collapsed ? (
                            <>
                                <button 
                                    className="section-header" 
                                    onClick={() => toggleSection('payment')}
                                    type="button"
                                >
                                    <span className="section-title">{t('sidebar.payment')}</span>
                                    <span className="section-toggle">
                                        {openSections.payment ? <IconChevronUp /> : <IconChevronDown />}
                                    </span>
                                </button>
                                {openSections.payment && (
                                    <nav className="section-content">
                                        {hasAccess('/admin-commission') && (
                                            <NavLink to="/admin-commission" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                                <IconPercent />
                                                <span>{t('sidebar.commission')}</span>
                                            </NavLink>
                                        )}
                                        {hasAccess('/admin-request') && (
                                            <NavLink to="/admin-request" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                                <IconWallet />
                                                <span>{t('sidebar.withdrawRequest')}</span>
                                            </NavLink>
                                        )}
                                        {hasAccess('/admin-discount') && (
                                            <NavLink to="/admin-discount" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}>
                                                <IconTicket />
                                                <span>{t('sidebar.discountCode')}</span>
                                            </NavLink>
                                        )}
                                    </nav>
                                )}
                            </>
                        ) : (
                            /* Collapsed state - show all payment page icons */
                            <div className="collapsed-section">
                                {hasAccess('/admin-commission') && (
                                    <NavLink to="/admin-commission" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title={t('sidebar.commission')}>
                                        <IconPercent />
                                    </NavLink>
                                )}
                                {hasAccess('/admin-request') && (
                                    <NavLink to="/admin-request" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title={t('sidebar.withdrawRequest')}>
                                        <IconWallet />
                                    </NavLink>
                                )}
                                {hasAccess('/admin-discount') && (
                                    <NavLink to="/admin-discount" onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''} title={t('sidebar.discountCode')}>
                                        <IconTicket />
                                    </NavLink>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </aside>
    );
}
