import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getCurrentUser } from '../../auth';
import { IconUser, IconSettings, IconLogout, IconDashboard, IconUsers, IconBox, IconWallet, IconShoppingBag, IconBook, IconMenu, IconAddressBook } from '../../admin/components/icons';
import { useState as useModalState } from 'react';
import UserProfileModal from './UserProfileModal';
import UserSettingModal from './UserSettingModal';
import { getAvatarInitial, getAvatarColor } from '../../utils/avatarUtils';

interface UserHeaderProps {
    title: string;
    mobileMenuOpen?: boolean;
    onMobileMenuToggle?: (e: React.MouseEvent) => void;
}

export default function UserHeader({ title, mobileMenuOpen, onMobileMenuToggle }: UserHeaderProps) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [profileOpen, setProfileOpen] = useModalState(false);
    const [settingOpen, setSettingOpen] = useModalState(false);
    const [userName, setUserName] = useState('User');
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    
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
                    // No avatar, set to null to use default letter avatar
                    setUserAvatar(null);
                }
            }
        } catch (error) {
            console.error('Error loading avatar:', error);
            // Keep default avatar on error
        }
    };
    
    useEffect(() => {
        // Initial load
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUserName(currentUser.name || 'User');
            
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
                setUserName(updatedUser.name || 'User');
                
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
        
        // Handle click outside dropdown
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
        if (location.pathname.startsWith('/dashboard')) return <IconDashboard style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/member')) return <IconUsers style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/client')) return <IconAddressBook style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/product')) return <IconBox style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/wallet')) return <IconWallet style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/orders')) return <IconShoppingBag style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/training')) return <IconBook style={{ marginRight: 8 }} />;
        return null;
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
                        <img className="avatar" src={userAvatar} alt={user.name} onError={(e) => {
                            // Fallback to default if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'avatar';
                                fallback.style.cssText = `
                                    width: 40px;
                                    height: 40px;
                                    border-radius: 50%;
                                    background-color: ${getAvatarColor(user.name)};
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: white;
                                    font-size: 16px;
                                    font-weight: 600;
                                    text-transform: uppercase;
                                `;
                                fallback.textContent = getAvatarInitial(user.name);
                                parent.insertBefore(fallback, target);
                            }
                        }} />
                    ) : (
                        <div 
                            className="avatar"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: getAvatarColor(user.name),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: 600,
                                textTransform: 'uppercase'
                            }}
                        >
                            {getAvatarInitial(user.name)}
                        </div>
                    )}
                    <span>{user.name}</span>
                </button>
                {open && (
                    <div className="dropdown">
                        <a href="#profile" onClick={(e) => { e.preventDefault(); setOpen(false); setProfileOpen(true); }}>
                            <IconUser /> Profile
                        </a>
                        <a href="#setting" onClick={(e) => { e.preventDefault(); setOpen(false); setSettingOpen(true); }}>
                            <IconSettings /> Settings
                        </a>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                logout();
                                setOpen(false);
                                navigate('/login', { replace: true });
                            }}
                        >
                            <IconLogout /> Logout
                        </a>
                    </div>
                )}
                <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
                <UserSettingModal open={settingOpen} onClose={() => setSettingOpen(false)} />
            </div>
        </header>
    );
}
