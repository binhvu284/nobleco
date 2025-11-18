import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconDashboard, IconUsers, IconSettings, IconUser, IconLogout, IconMenu, IconAdmin, IconBox, IconTag, IconShoppingBag, IconTicket } from './icons';
import { useState as useModalState } from 'react';
import { logout, getCurrentUser } from '../../auth';
import AdminProfileModal from './AdminProfileModal';
import AdminSettingModal from './AdminSettingModal';
import { getAvatarInitial, getAvatarColor } from '../../utils/avatarUtils';

interface AdminHeaderProps {
    title: string;
    mobileMenuOpen?: boolean;
    onMobileMenuToggle?: (e: React.MouseEvent) => void;
}

export default function AdminHeader({ title, mobileMenuOpen, onMobileMenuToggle }: AdminHeaderProps) {
    const [open, setOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useModalState(false);
    const [settingOpen, setSettingOpen] = useModalState(false);
    const [userName, setUserName] = useState('Admin User');
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    
    const loadUserAvatar = async (userId: number) => {
        try {
            const response = await fetch(`/api/user-avatars?userId=${userId}`);
            if (response.ok) {
                const avatarData = await response.json();
                if (avatarData?.url) {
                    setUserAvatar(avatarData.url);
                    // Update localStorage user data with avatar URL
                    const currentUser = getCurrentUser();
                    if (currentUser) {
                        const updatedUser = { ...currentUser, avatar: avatarData.url };
                        localStorage.setItem('nobleco_user_data', JSON.stringify(updatedUser));
                    }
                } else {
                    // No avatar, set to null to show default letter avatar
                    setUserAvatar(null);
                }
            } else {
                // API error, set to null to show default letter avatar
                setUserAvatar(null);
            }
        } catch (error) {
            console.error('Error loading avatar:', error);
            // Set to null to show default letter avatar on error
            setUserAvatar(null);
        }
    };
    
    useEffect(() => {
        // Initial load
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUserName(currentUser.name || 'Admin User');
            
            // Load avatar from API
            if (currentUser.id) {
                loadUserAvatar(Number(currentUser.id));
            }
            
            // Check if user data has avatar URL
            if (currentUser.avatar) {
                setUserAvatar(currentUser.avatar);
            }
        }
        
        // Listen for storage changes (when profile is updated)
        const handleStorageChange = () => {
            const updatedUser = getCurrentUser();
            if (updatedUser) {
                setUserName(updatedUser.name || 'Admin User');
                
                // Reload avatar if user ID is available
                if (updatedUser.id) {
                    loadUserAvatar(Number(updatedUser.id));
                }
                
                // Update avatar if it's in user data
                if (updatedUser.avatar) {
                    setUserAvatar(updatedUser.avatar);
                }
            }
        };
        
        // Listen for custom avatar update event
        const handleAvatarUpdate = (e: CustomEvent) => {
            if (e.detail?.avatarUrl) {
                setUserAvatar(e.detail.avatarUrl);
                // Update localStorage
                const currentUser = getCurrentUser();
                if (currentUser) {
                    const updatedUser = { ...currentUser, avatar: e.detail.avatarUrl };
                    localStorage.setItem('nobleco_user_data', JSON.stringify(updatedUser));
                }
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
        
        const onDocClick = (e: MouseEvent) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('click', onDocClick);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
            document.removeEventListener('click', onDocClick);
        };
    }, []);
    
    const currentUser = getCurrentUser();
    const user = { 
        name: userName
    };

    const iconForRoute = () => {
        if (location.pathname.startsWith('/admin-admin-users')) return <IconAdmin style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/admin-users')) return <IconUsers style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/admin-products')) return <IconBox style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/admin-categories')) return <IconTag style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/admin-orders')) return <IconShoppingBag style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/admin-dashboard')) return <IconDashboard style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/admin-discount')) return <IconTicket style={{ marginRight: 8 }} />;
        return <IconSettings style={{ marginRight: 8 }} />;
    };

    return (
        <header className="admin-header">
            {onMobileMenuToggle && (
                <button 
                    className="admin-mobile-toggle" 
                    aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} 
                    onClick={onMobileMenuToggle}
                >
                    <IconMenu />
                </button>
            )}
            <div className="admin-page-title">
                {iconForRoute()}
                <span>{title}</span>
            </div>
            <div className="admin-actions" ref={menuRef}>
                <button className="admin-user" onClick={() => setOpen((v) => !v)}>
                    {userAvatar ? (
                        <img 
                            src={userAvatar} 
                            alt={user.name} 
                            className="avatar"
                            onError={(e) => {
                                // Fallback to default letter avatar if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'avatar';
                                    fallback.style.cssText = `
                                        width: 28px;
                                        height: 28px;
                                        border-radius: 50%;
                                        background-color: ${getAvatarColor(user.name)};
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: white;
                                        font-size: 11px;
                                        font-weight: 600;
                                        text-transform: uppercase;
                                    `;
                                    fallback.textContent = getAvatarInitial(user.name);
                                    parent.insertBefore(fallback, target);
                                    // Update state to null so it doesn't try to load again
                                    setUserAvatar(null);
                                }
                            }}
                        />
                    ) : (
                        <div 
                            className="avatar"
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: getAvatarColor(user.name),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '11px',
                                fontWeight: 600,
                                textTransform: 'uppercase'
                            }}
                        >
                            {getAvatarInitial(user.name)}
                        </div>
                    )}
                    <span className="name">{user.name}</span>
                </button>
                {open && (
                    <div className="dropdown">
                        <a href="#profile" onClick={(e) => { e.preventDefault(); setOpen(false); setProfileOpen(true); }}>
                            <IconUser style={{ marginRight: 8 }} /> Profile
                        </a>
                        <a href="#settings" onClick={(e) => { e.preventDefault(); setOpen(false); setSettingOpen(true); }}>
                            <IconSettings style={{ marginRight: 8 }} /> Settings
                        </a>
                        <a href="/login" onClick={(e) => { e.preventDefault(); setOpen(false); logout(); navigate('/login', { replace: true }); }}>
                            <IconLogout style={{ marginRight: 8 }} /> Logout
                        </a>
                    </div>
                )}
                <AdminProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
                <AdminSettingModal open={settingOpen} onClose={() => setSettingOpen(false)} />
            </div>
        </header>
    );
}
