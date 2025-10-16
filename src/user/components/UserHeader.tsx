import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getCurrentUser } from '../../auth';
import { IconUser, IconSettings, IconLogout, IconDashboard, IconUsers, IconBox, IconWallet, IconCreditCard, IconBook } from '../../admin/components/icons';
import { useState as useModalState } from 'react';
import UserProfileModal from './UserProfileModal';
import UserSettingModal from './UserSettingModal';

export default function UserHeader({ title }: { title: string }) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [profileOpen, setProfileOpen] = useModalState(false);
    const [settingOpen, setSettingOpen] = useModalState(false);
    const [userName, setUserName] = useState('User');
    
    useEffect(() => {
        // Initial load
        const currentUser = getCurrentUser();
        setUserName(currentUser?.name || 'User');
        
        // Listen for storage changes (when profile is updated)
        const handleStorageChange = () => {
            const updatedUser = getCurrentUser();
            setUserName(updatedUser?.name || 'User');
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);
    
    const currentUser = getCurrentUser();
    const user = { 
        name: userName, 
        avatar: currentUser?.avatar || 'https://i.pravatar.cc/100?img=8' 
    };

    const iconForRoute = () => {
        if (location.pathname.startsWith('/dashboard')) return <IconDashboard style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/member')) return <IconUsers style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/product')) return <IconBox style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/wallet')) return <IconWallet style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/payment')) return <IconCreditCard style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/training')) return <IconBook style={{ marginRight: 8 }} />;
        return null;
    };

    return (
        <header className="admin-header">
            <div className="admin-page-title">
                {iconForRoute()}
                <span>{title}</span>
            </div>
            <div className="admin-actions">
                <button className="admin-user" onClick={() => setOpen((v) => !v)}>
                    <img className="avatar" src={user.avatar} alt="avatar" />
                    <span>{user.name}</span>
                </button>
                {open && (
                    <div className="dropdown" onMouseLeave={() => setOpen(false)}>
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
